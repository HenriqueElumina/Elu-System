-- Onda 2, Etapa 9.2 — Ficha de onboarding do colaborador.
--
-- Continuação direta do convite (Etapa 9.1): o mesmo formulário que cria
-- a conta também coleta a ficha (contato de emergência, saúde básica,
-- objetivos de carreira, dados pessoais). Um passo só, obrigatório pra
-- concluir o cadastro -- por isso a ficha entra como parâmetros a mais
-- de submit_employee_invite, gravada na mesma chamada que já cria
-- employee/employee_compensation, não uma etapa separada exigindo login.

create table employee_onboarding (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null unique references employee(id),
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  dietary_restrictions text,
  career_goals text,
  birth_date date,
  document text,
  address_zip_code text,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger employee_onboarding_set_updated_at
  before update on employee_onboarding
  for each row
  execute function set_updated_at();

alter table employee_onboarding enable row level security;

-- socio/financeiro veem/editam qualquer ficha; o próprio colaborador só
-- a dele (pode corrigir um dado próprio depois, ex.: telefone mudou).
create policy employee_onboarding_select on employee_onboarding
  for select using (
    auth_role() in ('socio', 'financeiro')
    or exists (
      select 1 from employee e
      where e.id = employee_onboarding.employee_id and e.profile_id = auth.uid()
    )
  );

create policy employee_onboarding_write on employee_onboarding
  for all using (
    auth_role() in ('socio', 'financeiro')
    or exists (
      select 1 from employee e
      where e.id = employee_onboarding.employee_id and e.profile_id = auth.uid()
    )
  )
  with check (
    auth_role() in ('socio', 'financeiro')
    or exists (
      select 1 from employee e
      where e.id = employee_onboarding.employee_id and e.profile_id = auth.uid()
    )
  );

grant select, insert, update, delete on employee_onboarding to authenticated;

-- ---------------------------------------------------------------------------
-- submit_employee_invite: troca a assinatura (2 params -> 16) pra gravar
-- a ficha na mesma chamada. Precisa dropar a versão antiga primeiro --
-- Postgres identifica função por nome + tipos dos parâmetros.
-- ---------------------------------------------------------------------------

drop function submit_employee_invite(uuid, uuid);

create function submit_employee_invite(
  p_token uuid,
  p_profile_id uuid,
  p_emergency_contact_name text,
  p_emergency_contact_phone text,
  p_emergency_contact_relationship text,
  p_dietary_restrictions text,
  p_career_goals text,
  p_birth_date date,
  p_document text,
  p_address_zip_code text,
  p_address_street text,
  p_address_number text,
  p_address_complement text,
  p_address_neighborhood text,
  p_address_city text,
  p_address_state text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite employee_invite;
  v_profile_email text;
  v_employee_id uuid;
begin
  select * into v_invite from employee_invite where token = p_token for update;

  if not found then
    raise exception 'Convite não encontrado' using errcode = 'no_data_found';
  elsif v_invite.status = 'submitted' then
    raise exception 'Este convite já foi respondido' using errcode = 'integrity_constraint_violation';
  elsif v_invite.expires_at < now() then
    raise exception 'Este convite expirou' using errcode = 'integrity_constraint_violation';
  end if;

  select email into v_profile_email from profile where id = p_profile_id;

  if v_profile_email is null then
    raise exception 'Perfil não encontrado' using errcode = 'no_data_found';
  elsif lower(v_profile_email) <> lower(v_invite.email) then
    raise exception 'O e-mail da conta não confere com o convite' using errcode = 'integrity_constraint_violation';
  end if;

  insert into employee (profile_id, role_title, admission_date)
  values (p_profile_id, v_invite.role_title, v_invite.admission_date)
  returning id into v_employee_id;

  if v_invite.hourly_cost_cents is not null then
    insert into employee_compensation (employee_id, hourly_cost_cents)
    values (v_employee_id, v_invite.hourly_cost_cents);
  end if;

  insert into employee_onboarding (
    employee_id, emergency_contact_name, emergency_contact_phone,
    emergency_contact_relationship, dietary_restrictions, career_goals,
    birth_date, document, address_zip_code, address_street, address_number,
    address_complement, address_neighborhood, address_city, address_state
  )
  values (
    v_employee_id, nullif(p_emergency_contact_name, ''), nullif(p_emergency_contact_phone, ''),
    nullif(p_emergency_contact_relationship, ''), nullif(p_dietary_restrictions, ''), nullif(p_career_goals, ''),
    p_birth_date, nullif(p_document, ''), nullif(p_address_zip_code, ''), nullif(p_address_street, ''),
    nullif(p_address_number, ''), nullif(p_address_complement, ''), nullif(p_address_neighborhood, ''),
    nullif(p_address_city, ''), nullif(upper(p_address_state), '')
  );

  update employee_invite
  set status = 'submitted', employee_id = v_employee_id, submitted_at = now()
  where id = v_invite.id;

  return v_employee_id;
end;
$$;

grant execute on function submit_employee_invite(
  uuid, uuid, text, text, text, text, text, date, text, text, text, text, text, text, text, text
) to anon;

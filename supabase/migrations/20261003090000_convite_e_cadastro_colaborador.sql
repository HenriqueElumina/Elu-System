-- Onda 2, Etapa 9.1 — Colaboradores (RH): convite e cadastro básico.
--
-- Mesma ideia do convite de cliente (Etapa 1.1), mas colaborador precisa
-- de login de verdade -- a pessoa convidada cria a própria senha
-- (auth.signUp, chave anônima, sem service_role); o e-mail vem travado
-- do convite, não é digitado por ela. sócio/financeiro pré-cadastram
-- cargo/custo-hora/admissão no convite; a função de submissão cria
-- `employee`/`employee_compensation` só depois que a conta existe.

-- ---------------------------------------------------------------------------
-- Correção de segurança: handle_new_user() (Etapa 0.4) confiava no `role`
-- vindo do próprio cadastro (raw_user_meta_data, controlado pelo
-- cliente). Isso nunca foi explorável porque não existia formulário
-- público de cadastro no app -- só criação direta no painel do Supabase.
-- A partir desta etapa isso muda (auto-cadastro pelo link de convite),
-- então trava: todo mundo que se cadastra sozinho nasce "colaborador",
-- sem exceção. Promoção continua manual, só por socio (profile_update).
-- ---------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profile (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'colaborador'
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- employee: cargo (não sensível, fica na tabela já ampla). Custo/hora vai
-- pra tabela separada (employee_compensation) -- dado mais sensível,
-- RLS mais restrita do que a leitura ampla de employee.
-- ---------------------------------------------------------------------------

alter table employee
  add column role_title text;

create table employee_compensation (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null unique references employee(id),
  hourly_cost_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_compensation_hourly_cost_cents_non_negative
    check (hourly_cost_cents is null or hourly_cost_cents >= 0)
);

create trigger employee_compensation_set_updated_at
  before update on employee_compensation
  for each row
  execute function set_updated_at();

alter table employee_compensation enable row level security;

-- Só socio/financeiro -- o dado mais sensível do RH (CLAUDE.md, seção 5).
create policy employee_compensation_select on employee_compensation
  for select using (auth_role() in ('socio', 'financeiro'));
create policy employee_compensation_write on employee_compensation
  for all using (auth_role() in ('socio', 'financeiro'))
  with check (auth_role() in ('socio', 'financeiro'));

grant select, insert, update, delete on employee_compensation to authenticated;

-- ---------------------------------------------------------------------------
-- employee_invite: link único gerado por socio/financeiro (só eles, porque
-- o formulário de convite já inclui custo/hora). Mesmo padrão do
-- client_invite -- quem recebe o link nunca acessa esta tabela direto,
-- só através das funções abaixo.
-- ---------------------------------------------------------------------------

create type employee_invite_status as enum ('pending', 'submitted');

create table employee_invite (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  status employee_invite_status not null default 'pending',
  email text not null,
  role_title text,
  hourly_cost_cents integer,
  admission_date date,
  created_by_profile_id uuid not null references profile(id),
  employee_id uuid references employee(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  submitted_at timestamptz,
  constraint employee_invite_hourly_cost_cents_non_negative
    check (hourly_cost_cents is null or hourly_cost_cents >= 0)
);

create index idx_employee_invite_token on employee_invite(token);

alter table employee_invite enable row level security;

create policy employee_invite_select on employee_invite
  for select using (auth_role() in ('socio', 'financeiro'));
create policy employee_invite_insert on employee_invite
  for insert with check (auth_role() in ('socio', 'financeiro'));

grant select, insert on employee_invite to authenticated;

-- ---------------------------------------------------------------------------
-- Funções públicas (SECURITY DEFINER): únicas portas de entrada pra quem
-- ainda não tem conta. get_employee_invite só devolve o e-mail (pra
-- mostrar travado no formulário) -- cargo/custo ficam escondidos até a
-- conta existir. submit_employee_invite recebe o profile_id já criado
-- pelo auth.signUp (chamado separadamente, pela chave anônima -- sem
-- service_role) e só então materializa employee/employee_compensation.
-- ---------------------------------------------------------------------------

create function get_employee_invite(p_token uuid)
returns table (valid boolean, reason text, email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite employee_invite;
begin
  select * into v_invite from employee_invite where token = p_token;

  if not found then
    return query select false, 'not_found', null::text;
  elsif v_invite.status = 'submitted' then
    return query select false, 'already_submitted', null::text;
  elsif v_invite.expires_at < now() then
    return query select false, 'expired', null::text;
  else
    return query select true, null::text, v_invite.email;
  end if;
end;
$$;

grant execute on function get_employee_invite(uuid) to anon;

create function submit_employee_invite(p_token uuid, p_profile_id uuid)
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

  update employee_invite
  set status = 'submitted', employee_id = v_employee_id, submitted_at = now()
  where id = v_invite.id;

  return v_employee_id;
end;
$$;

grant execute on function submit_employee_invite(uuid, uuid) to anon;

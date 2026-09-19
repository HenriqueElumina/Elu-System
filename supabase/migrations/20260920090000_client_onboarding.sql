-- Onda 1, Etapa 1.1 — Cadastro de clientes: formulário público (link único)
-- que o cliente preenche após fechar contrato, revisão por sócio/gestor
-- antes de virar cadastro oficial, e captura de baseline de redes sociais.

-- ---------------------------------------------------------------------------
-- client: tipo de documento, endereço e status do onboarding
-- ---------------------------------------------------------------------------

create type document_type as enum ('cnpj', 'cpf');

create type client_onboarding_status as enum (
  'invited',
  'pending_review',
  'approved'
);

alter table client
  add column document_type document_type not null default 'cnpj',
  add column onboarding_status client_onboarding_status not null default 'approved',
  add column address_zip_code text,
  add column address_street text,
  add column address_number text,
  add column address_complement text,
  add column address_neighborhood text,
  add column address_city text,
  add column address_state text;

alter table client alter column document_type drop default;

-- ---------------------------------------------------------------------------
-- client_contact: contato financeiro (pode ser o mesmo que o principal)
-- ---------------------------------------------------------------------------

alter table client_contact
  add column is_billing boolean not null default false;

-- ---------------------------------------------------------------------------
-- client_social_account: baseline de seguidores/inscritos por rede,
-- capturado no momento do fechamento. Métricas ao longo do tempo (novas
-- medições) ficam para o módulo de Conteúdo, Onda 2.
-- ---------------------------------------------------------------------------

create type social_platform as enum (
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'linkedin',
  'other'
);

create table client_social_account (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references client(id) on delete cascade,
  platform social_platform not null,
  platform_other_label text,
  handle text,
  followers_count integer,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint client_social_account_followers_non_negative
    check (followers_count is null or followers_count >= 0),
  constraint client_social_account_other_label_required
    check (platform <> 'other' or platform_other_label is not null)
);

create index idx_client_social_account_client_id on client_social_account(client_id);

alter table client_social_account enable row level security;

create policy client_social_account_select on client_social_account
  for select using (auth_role() in ('socio', 'financeiro', 'gestor', 'colaborador'));
create policy client_social_account_write on client_social_account
  for all using (auth_role() in ('socio', 'financeiro', 'gestor'))
  with check (auth_role() in ('socio', 'financeiro', 'gestor'));

grant select, insert, update, delete on client_social_account to authenticated;

-- ---------------------------------------------------------------------------
-- client_invite: link único gerado por sócio/gestor para o cliente
-- preencher os próprios dados. Só sócio/gestor enxergam esta tabela --
-- quem preenche o formulário nunca acessa ela diretamente, só através das
-- funções abaixo.
-- ---------------------------------------------------------------------------

create type client_invite_status as enum ('pending', 'submitted');

create table client_invite (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  status client_invite_status not null default 'pending',
  note text,
  created_by_profile_id uuid not null references profile(id),
  client_id uuid references client(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  submitted_at timestamptz
);

create index idx_client_invite_token on client_invite(token);

alter table client_invite enable row level security;

create policy client_invite_select on client_invite
  for select using (auth_role() in ('socio', 'gestor'));
create policy client_invite_insert on client_invite
  for insert with check (auth_role() in ('socio', 'gestor'));

grant select, insert on client_invite to authenticated;

-- ---------------------------------------------------------------------------
-- Funções públicas (SECURITY DEFINER): únicas portas de entrada para quem
-- não está logado. Nenhuma tabela é exposta diretamente a "anon" -- só
-- estas duas funções, cada uma validando o token por conta própria.
-- ---------------------------------------------------------------------------

create function get_client_invite(p_token uuid)
returns table (valid boolean, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite client_invite;
begin
  select * into v_invite from client_invite where token = p_token;

  if not found then
    return query select false, 'not_found';
  elsif v_invite.status = 'submitted' then
    return query select false, 'already_submitted';
  elsif v_invite.expires_at < now() then
    return query select false, 'expired';
  else
    return query select true, null::text;
  end if;
end;
$$;

grant execute on function get_client_invite(uuid) to anon;

create function submit_client_invite(
  p_token uuid,
  p_legal_name text,
  p_trade_name text,
  p_document_type document_type,
  p_document text,
  p_email text,
  p_phone text,
  p_address_zip_code text,
  p_address_street text,
  p_address_number text,
  p_address_complement text,
  p_address_neighborhood text,
  p_address_city text,
  p_address_state text,
  p_contact_name text,
  p_contact_role_title text,
  p_contact_email text,
  p_contact_phone text,
  p_billing_same_as_primary boolean,
  p_billing_contact_name text,
  p_billing_contact_email text,
  p_billing_contact_phone text,
  p_social jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite client_invite;
  v_client_id uuid;
  v_social jsonb;
begin
  select * into v_invite from client_invite where token = p_token for update;

  if not found then
    raise exception 'Convite não encontrado' using errcode = 'no_data_found';
  elsif v_invite.status = 'submitted' then
    raise exception 'Este convite já foi respondido' using errcode = 'integrity_constraint_violation';
  elsif v_invite.expires_at < now() then
    raise exception 'Este convite expirou' using errcode = 'integrity_constraint_violation';
  end if;

  insert into client (
    legal_name, trade_name, document_type, document, email, phone,
    address_zip_code, address_street, address_number, address_complement,
    address_neighborhood, address_city, address_state, onboarding_status
  ) values (
    p_legal_name, nullif(p_trade_name, ''), p_document_type, p_document, nullif(p_email, ''), p_phone,
    p_address_zip_code, p_address_street, p_address_number, nullif(p_address_complement, ''),
    p_address_neighborhood, p_address_city, upper(p_address_state), 'pending_review'
  )
  returning id into v_client_id;

  insert into client_contact (client_id, full_name, email, phone, role_title, is_primary, is_billing)
  values (
    v_client_id, p_contact_name, p_contact_email, p_contact_phone, nullif(p_contact_role_title, ''),
    true, p_billing_same_as_primary
  );

  if not p_billing_same_as_primary then
    insert into client_contact (client_id, full_name, email, phone, is_primary, is_billing)
    values (v_client_id, p_billing_contact_name, p_billing_contact_email, p_billing_contact_phone, false, true);
  end if;

  for v_social in select * from jsonb_array_elements(p_social)
  loop
    insert into client_social_account (client_id, platform, platform_other_label, handle, followers_count)
    values (
      v_client_id,
      (v_social->>'platform')::social_platform,
      v_social->>'platformOtherLabel',
      nullif(v_social->>'handle', ''),
      nullif(v_social->>'followersCount', '')::integer
    );
  end loop;

  update client_invite
  set status = 'submitted', client_id = v_client_id, submitted_at = now()
  where id = v_invite.id;

  return v_client_id;
end;
$$;

grant execute on function submit_client_invite(
  uuid, text, text, document_type, text, text, text,
  text, text, text, text, text, text, text,
  text, text, text, text,
  boolean, text, text, text,
  jsonb
) to anon;

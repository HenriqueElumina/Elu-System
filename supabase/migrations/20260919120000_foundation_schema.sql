-- Etapa 0.3 — Fundação: usuários/perfis, clientes, serviços, contratos, projetos, colaboradores.
-- Depende do schema auth.users, provido pelo Supabase Auth.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------------

create type user_role as enum (
  'socio',
  'financeiro',
  'gestor',
  'colaborador',
  'freelancer',
  'cliente'
);

create type service_line as enum (
  'social_media',
  'audiovisual',
  'marketplace'
);

create type service_billing_type as enum (
  'recurring_monthly',
  'one_time'
);

create type contract_status as enum (
  'draft',
  'sent',
  'signed',
  'active',
  'cancelled',
  'finished'
);

create type signature_provider as enum (
  'clicksign',
  'zapsign'
);

create type project_status as enum (
  'planning',
  'active',
  'completed',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- Função utilitária: updated_at automático
-- ---------------------------------------------------------------------------

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profile: conta ligada ao auth.users do Supabase + perfil de acesso
-- ---------------------------------------------------------------------------

create table profile (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profile_set_updated_at
  before update on profile
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- employee: registro de colaborador/sócio (mínimo por ora; RH completo é Onda 2)
-- ---------------------------------------------------------------------------

create table employee (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profile(id) on delete cascade,
  admission_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger employee_set_updated_at
  before update on employee
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- client / client_contact
-- ---------------------------------------------------------------------------

create table client (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trade_name text,
  document text not null unique,
  email text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger client_set_updated_at
  before update on client
  for each row
  execute function set_updated_at();

create table client_contact (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references client(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role_title text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger client_contact_set_updated_at
  before update on client_contact
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- service: catálogo (playbook detalhado fica para a etapa do módulo 2)
-- ---------------------------------------------------------------------------

create table service (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  service_line service_line not null,
  billing_type service_billing_type not null default 'recurring_monthly',
  base_price_cents bigint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint service_base_price_cents_non_negative check (base_price_cents >= 0)
);

create trigger service_set_updated_at
  before update on service
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- contract / contract_item
-- ---------------------------------------------------------------------------

create table contract (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references client(id),
  status contract_status not null default 'draft',
  signature_provider signature_provider,
  signature_status text,
  external_signature_id text,
  signed_at timestamptz,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint contract_end_date_after_start check (end_date is null or end_date >= start_date)
);

create trigger contract_set_updated_at
  before update on contract
  for each row
  execute function set_updated_at();

create table contract_item (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contract(id) on delete cascade,
  service_id uuid not null references service(id),
  quantity integer not null default 1,
  unit_price_cents bigint not null,
  billing_type service_billing_type not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_item_quantity_positive check (quantity > 0),
  constraint contract_item_unit_price_cents_non_negative check (unit_price_cents >= 0)
);

create trigger contract_item_set_updated_at
  before update on contract_item
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- project: nasce do handoff automático venda -> operação
-- ---------------------------------------------------------------------------

create table project (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references client(id),
  contract_id uuid references contract(id),
  name text not null,
  status project_status not null default 'planning',
  start_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger project_set_updated_at
  before update on project
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- audit_log: ações sensíveis (contratos, permissões, credenciais). Imutável.
-- ---------------------------------------------------------------------------

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references profile(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Índices de apoio
-- ---------------------------------------------------------------------------

create index idx_employee_profile_id on employee(profile_id);
create index idx_client_contact_client_id on client_contact(client_id);
create index idx_contract_client_id on contract(client_id);
create index idx_contract_item_contract_id on contract_item(contract_id);
create index idx_contract_item_service_id on contract_item(service_id);
create index idx_project_client_id on project(client_id);
create index idx_project_contract_id on project(contract_id);
create index idx_audit_log_entity on audit_log(entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

create or replace function auth_role()
returns user_role
language sql
security definer
stable
as $$
  select role from profile where id = auth.uid();
$$;

alter table profile enable row level security;
alter table employee enable row level security;
alter table client enable row level security;
alter table client_contact enable row level security;
alter table service enable row level security;
alter table contract enable row level security;
alter table contract_item enable row level security;
alter table project enable row level security;
alter table audit_log enable row level security;

-- profile: cada um vê a própria conta; sócio vê todas.
create policy profile_select on profile
  for select using (id = auth.uid() or auth_role() = 'socio');
create policy profile_update on profile
  for update using (auth_role() = 'socio');
create policy profile_insert on profile
  for insert with check (auth_role() = 'socio');

-- employee: leitura para perfis internos; escrita só sócio.
create policy employee_select on employee
  for select using (auth_role() in ('socio', 'financeiro', 'gestor', 'colaborador'));
create policy employee_write on employee
  for all using (auth_role() = 'socio') with check (auth_role() = 'socio');

-- client / client_contact: leitura para todo perfil interno (colaborador
-- ainda sem filtro por alocação em projeto -- isso chega com o módulo de
-- Tarefas/projetos na Onda 2, ver docs/backlog.md); escrita para
-- socio/financeiro/gestor.
create policy client_select on client
  for select using (auth_role() in ('socio', 'financeiro', 'gestor', 'colaborador'));
create policy client_write on client
  for all using (auth_role() in ('socio', 'financeiro', 'gestor'))
  with check (auth_role() in ('socio', 'financeiro', 'gestor'));

create policy client_contact_select on client_contact
  for select using (auth_role() in ('socio', 'financeiro', 'gestor', 'colaborador'));
create policy client_contact_write on client_contact
  for all using (auth_role() in ('socio', 'financeiro', 'gestor'))
  with check (auth_role() in ('socio', 'financeiro', 'gestor'));

-- service: leitura para todo perfil interno; escrita socio/gestor.
create policy service_select on service
  for select using (auth_role() in ('socio', 'financeiro', 'gestor', 'colaborador'));
create policy service_write on service
  for all using (auth_role() in ('socio', 'gestor'))
  with check (auth_role() in ('socio', 'gestor'));

-- contract / contract_item: dados comerciais/financeiros sensíveis.
-- socio: tudo. gestor: lê e escreve (fecha venda). financeiro: só lê
-- (precisa para cobrança). colaborador/freelancer/cliente: sem acesso.
create policy contract_select on contract
  for select using (auth_role() in ('socio', 'financeiro', 'gestor'));
create policy contract_write on contract
  for all using (auth_role() in ('socio', 'gestor'))
  with check (auth_role() in ('socio', 'gestor'));

create policy contract_item_select on contract_item
  for select using (auth_role() in ('socio', 'financeiro', 'gestor'));
create policy contract_item_write on contract_item
  for all using (auth_role() in ('socio', 'gestor'))
  with check (auth_role() in ('socio', 'gestor'));

-- project: socio tudo; gestor lê/escreve; colaborador só lê (mesma
-- simplificação do client, sem filtro por alocação ainda).
create policy project_select on project
  for select using (auth_role() in ('socio', 'gestor', 'colaborador'));
create policy project_write on project
  for all using (auth_role() in ('socio', 'gestor'))
  with check (auth_role() in ('socio', 'gestor'));

-- audit_log: qualquer perfil interno autenticado pode inserir (a própria
-- aplicação decide quando registrar); só sócio pode ler. Sem update/delete
-- (imutável -- nenhuma policy for update/delete = sempre negado).
create policy audit_log_insert on audit_log
  for insert with check (auth_role() is not null);
create policy audit_log_select on audit_log
  for select using (auth_role() = 'socio');

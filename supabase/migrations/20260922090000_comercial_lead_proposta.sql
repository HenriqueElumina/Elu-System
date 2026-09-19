-- Onda 1, Etapa 1.3 — Comercial: pipeline de leads e propostas.
-- Contrato, assinatura digital e handoff automático ficam para a Etapa 1.4.

create type lead_status as enum ('new', 'in_negotiation', 'won', 'lost');

create table lead (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  status lead_status not null default 'new',
  lost_reason text,
  client_id uuid references client(id),
  owner_profile_id uuid not null references profile(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_lead_status on lead(status);
create index idx_lead_client_id on lead(client_id);

create trigger lead_set_updated_at
  before update on lead
  for each row
  execute function set_updated_at();

alter table lead enable row level security;

create policy lead_select on lead
  for select using (auth_role() in ('socio', 'financeiro', 'gestor'));
create policy lead_write on lead
  for all using (auth_role() in ('socio', 'gestor'))
  with check (auth_role() in ('socio', 'gestor'));

grant select, insert, update, delete on lead to authenticated;

create type proposal_status as enum ('draft', 'sent', 'accepted', 'rejected');

create table proposal (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references lead(id) on delete cascade,
  status proposal_status not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_proposal_lead_id on proposal(lead_id);

create trigger proposal_set_updated_at
  before update on proposal
  for each row
  execute function set_updated_at();

alter table proposal enable row level security;

create policy proposal_select on proposal
  for select using (auth_role() in ('socio', 'financeiro', 'gestor'));
create policy proposal_write on proposal
  for all using (auth_role() in ('socio', 'gestor'))
  with check (auth_role() in ('socio', 'gestor'));

grant select, insert, update, delete on proposal to authenticated;

create table proposal_item (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposal(id) on delete cascade,
  service_id uuid not null references service(id),
  quantity integer not null default 1,
  unit_price_cents bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proposal_item_quantity_positive check (quantity > 0),
  constraint proposal_item_unit_price_cents_non_negative check (unit_price_cents >= 0)
);

create index idx_proposal_item_proposal_id on proposal_item(proposal_id);
create index idx_proposal_item_service_id on proposal_item(service_id);

create trigger proposal_item_set_updated_at
  before update on proposal_item
  for each row
  execute function set_updated_at();

alter table proposal_item enable row level security;

create policy proposal_item_select on proposal_item
  for select using (auth_role() in ('socio', 'financeiro', 'gestor'));
create policy proposal_item_write on proposal_item
  for all using (auth_role() in ('socio', 'gestor'))
  with check (auth_role() in ('socio', 'gestor'));

grant select, insert, update, delete on proposal_item to authenticated;

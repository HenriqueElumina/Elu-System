-- Onda 1, Etapa 1.9 — Financeiro: contas a pagar (lançamento manual) e
-- fluxo de caixa básico.
--
-- Diferente de `invoice` (Etapa 1.7), não nasce de nada automático --
-- é lançamento manual mesmo, sem contrato/recorrência por trás. Fluxo
-- de caixa (tela) só lê `invoice`/`payable`, não precisa de tabela nova.

create type payable_status as enum ('pending', 'paid');

create table payable (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount_cents integer not null,
  due_date date not null,
  status payable_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint payable_amount_cents_positive check (amount_cents > 0)
);

create index idx_payable_due_date on payable(due_date);

create trigger payable_set_updated_at
  before update on payable
  for each row
  execute function set_updated_at();

alter table payable enable row level security;

-- Mesmo padrão de acesso do invoice: socio tudo, financeiro lê/escreve
-- (dono das contas a pagar), gestor só lê, colaborador sem acesso.
create policy payable_select on payable
  for select using (auth_role() in ('socio', 'financeiro', 'gestor'));
create policy payable_write on payable
  for all using (auth_role() in ('socio', 'financeiro'))
  with check (auth_role() in ('socio', 'financeiro'));

grant select, insert, update, delete on payable to authenticated;

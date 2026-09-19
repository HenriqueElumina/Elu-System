-- Onda 1, Etapa 1.2 — Catálogo de serviços e playbooks.

-- ---------------------------------------------------------------------------
-- Correção: catálogo (service) só é editável por sócio, conforme
-- docs/00-visao.md (gestor tem catálogo em modo leitura). A policy da
-- Etapa 0.3 deixava gestor escrever também -- descuido, corrigindo aqui.
-- ---------------------------------------------------------------------------

drop policy service_write on service;

create policy service_write on service
  for all using (auth_role() = 'socio')
  with check (auth_role() = 'socio');

-- ---------------------------------------------------------------------------
-- playbook_step: etapas do playbook de cada serviço. Um serviço tem uma
-- lista ordenada de etapas -- sem tabela "playbook" separada por ora (sem
-- versionamento, decisão registrada na Etapa 1.2). Mesma regra de escrita
-- do catálogo: só sócio.
-- ---------------------------------------------------------------------------

create table playbook_step (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references service(id) on delete cascade,
  position integer not null,
  name text not null,
  description text,
  sla_days integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint playbook_step_position_positive check (position > 0),
  constraint playbook_step_sla_days_non_negative check (sla_days is null or sla_days >= 0)
);

create index idx_playbook_step_service_id on playbook_step(service_id);

create trigger playbook_step_set_updated_at
  before update on playbook_step
  for each row
  execute function set_updated_at();

alter table playbook_step enable row level security;

create policy playbook_step_select on playbook_step
  for select using (auth_role() in ('socio', 'financeiro', 'gestor', 'colaborador'));
create policy playbook_step_write on playbook_step
  for all using (auth_role() = 'socio')
  with check (auth_role() = 'socio');

grant select, insert, update, delete on playbook_step to authenticated;

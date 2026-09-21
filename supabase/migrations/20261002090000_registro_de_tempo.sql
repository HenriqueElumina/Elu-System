-- Onda 2, Etapa 2.3 — Registro de tempo (lançamento manual de horas).
--
-- Lançamento manual, não timer ao vivo ("simples primeiro", CLAUDE.md).
-- Mesma regra de permissão de update_task_status (Etapa 2.2): só o
-- responsável da tarefa ou socio/gestor lançam. Corrigir um lançamento
-- errado é apagar (soft-delete) e lançar de novo -- sem edição em linha
-- do valor nesta etapa.

create table time_entry (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references task(id),
  profile_id uuid not null references profile(id),
  work_date date not null default current_date,
  hours numeric(5, 2) not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint time_entry_hours_positive check (hours > 0)
);

create index idx_time_entry_task_id on time_entry(task_id);

create trigger time_entry_set_updated_at
  before update on time_entry
  for each row
  execute function set_updated_at();

alter table time_entry enable row level security;

-- Mesmo grupo de leitura do task.
create policy time_entry_select on time_entry
  for select using (auth_role() in ('socio', 'gestor', 'colaborador'));

-- Insere só a própria hora (profile_id = quem está logado), e só numa
-- tarefa que é responsável, a menos que seja socio/gestor (que lançam
-- em qualquer tarefa).
create policy time_entry_insert on time_entry
  for insert with check (
    profile_id = auth.uid()
    and (
      auth_role() in ('socio', 'gestor')
      or exists (
        select 1 from task t where t.id = task_id and t.assigned_to = auth.uid()
      )
    )
  );

-- Editar/soft-delete só socio/gestor (corrigir lançamento de terceiros).
create policy time_entry_update on time_entry
  for update using (auth_role() in ('socio', 'gestor'))
  with check (auth_role() in ('socio', 'gestor'));

grant select, insert, update on time_entry to authenticated;

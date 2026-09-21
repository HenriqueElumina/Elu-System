-- Onda 2, Etapa 2.2 — Responsável, estimativa de horas e histórico de
-- status da tarefa.
--
-- Responsável restringe quem pode avançar o status: colaborador só mexe
-- na própria tarefa atribuída; socio/gestor continuam podendo mexer em
-- qualquer uma. Consequência esperada: tarefas já existentes (Etapa 2.1,
-- sem responsável) ficam bloqueadas pra colaborador até alguém atribuir.

alter table task
  add column assigned_to uuid references profile(id),
  add column estimated_hours numeric(6, 2);

create index idx_task_assigned_to on task(assigned_to);

-- ---------------------------------------------------------------------------
-- task_status_history: só gravada pela update_task_status abaixo -- não
-- tem policy de insert/update/delete pra authenticated, e não precisa
-- (a função é SECURITY DEFINER, roda com o privilégio de quem é dono
-- da função, não de quem chama).
-- ---------------------------------------------------------------------------

create table task_status_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references task(id),
  from_status task_status,
  to_status task_status not null,
  changed_by uuid references profile(id),
  changed_at timestamptz not null default now()
);

create index idx_task_status_history_task_id on task_status_history(task_id);

alter table task_status_history enable row level security;

-- Mesmo grupo de leitura do task.
create policy task_status_history_select on task_status_history
  for select using (auth_role() in ('socio', 'gestor', 'colaborador'));

grant select on task_status_history to authenticated;

-- ---------------------------------------------------------------------------
-- update_task_status: agora checa se colaborador é o responsável pela
-- tarefa, e grava a mudança em task_status_history.
-- ---------------------------------------------------------------------------

create or replace function update_task_status(p_task_id uuid, p_status task_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role;
  v_assigned_to uuid;
  v_old_status task_status;
begin
  v_role := auth_role();
  if v_role not in ('socio', 'gestor', 'colaborador') then
    raise exception 'Sem permissão para alterar tarefas' using errcode = 'insufficient_privilege';
  end if;

  select assigned_to, status into v_assigned_to, v_old_status
  from task
  where id = p_task_id;

  if not found then
    raise exception 'Tarefa não encontrada' using errcode = 'no_data_found';
  end if;

  if v_role = 'colaborador' and (v_assigned_to is null or v_assigned_to <> auth.uid()) then
    raise exception 'Só o responsável pela tarefa pode alterar o status' using errcode = 'insufficient_privilege';
  end if;

  update task set status = p_status where id = p_task_id;

  insert into task_status_history (task_id, from_status, to_status, changed_by)
  values (p_task_id, v_old_status, p_status, auth.uid());
end;
$$;

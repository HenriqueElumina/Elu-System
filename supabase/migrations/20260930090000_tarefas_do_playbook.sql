-- Onda 2, Etapa 2.1 — Tarefas nascendo do playbook do projeto.
--
-- Quando o projeto nasce (Etapa 1.6), gera sozinho uma `task` por
-- `playbook_step` de cada serviço vendido no contrato -- fecha a parte
-- de "tarefas de onboarding" do handoff automático venda→operação que
-- tinha ficado pendente desde a Etapa 1.6. Só título/descrição/SLA são
-- copiados (snapshot) -- se o playbook do serviço mudar depois, as
-- tarefas já criadas não mudam junto.

create type task_status as enum ('pending', 'in_progress', 'done');

create table task (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id),
  playbook_step_id uuid references playbook_step(id),
  title text not null,
  description text,
  status task_status not null default 'pending',
  due_date date,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_task_project_id on task(project_id);

create trigger task_set_updated_at
  before update on task
  for each row
  execute function set_updated_at();

alter table task enable row level security;

-- Mesmo grupo do project: socio/gestor/colaborador leem (sem financeiro,
-- que não mexe em operação); escrita completa só socio/gestor. Colaborador
-- avança status pela função update_task_status abaixo -- sem atribuição
-- de responsável ainda, então por ora qualquer um do time operacional
-- pode mexer em qualquer tarefa do projeto (ver ADR desta etapa).
create policy task_select on task
  for select using (auth_role() in ('socio', 'gestor', 'colaborador'));
create policy task_write on task
  for all using (auth_role() in ('socio', 'gestor'))
  with check (auth_role() in ('socio', 'gestor'));

grant select, insert, update, delete on task to authenticated;

-- ---------------------------------------------------------------------------
-- update_task_status: única porta de entrada pro colaborador (sem policy
-- de escrita direta na tabela) avançar/reabrir o status de uma tarefa.
-- SECURITY DEFINER, como as demais ações estreitas do sistema.
-- ---------------------------------------------------------------------------

create function update_task_status(p_task_id uuid, p_status task_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth_role() not in ('socio', 'gestor', 'colaborador') then
    raise exception 'Sem permissão para alterar tarefas' using errcode = 'insufficient_privilege';
  end if;

  update task set status = p_status where id = p_task_id;

  if not found then
    raise exception 'Tarefa não encontrada' using errcode = 'no_data_found';
  end if;
end;
$$;

grant execute on function update_task_status(uuid, task_status) to authenticated;

-- ---------------------------------------------------------------------------
-- handle_contract_signed: estende a função das Etapas 1.6/1.7 (mesma
-- trigger, corpo trocado) pra gerar as tarefas na mesma transação que
-- cria o projeto.
-- ---------------------------------------------------------------------------

create or replace function handle_contract_signed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_client_name text;
  v_monthly_total_cents integer;
  v_due_day integer;
  v_step record;
begin
  if new.status = 'signed' and (old.status is distinct from new.status) then
    if not exists (select 1 from project where contract_id = new.id) then
      select coalesce(trade_name, legal_name) into v_client_name
      from client
      where id = new.client_id;

      insert into project (client_id, contract_id, name, start_date)
      values (new.client_id, new.id, v_client_name, new.start_date)
      returning id into v_project_id;

      insert into audit_log (actor_profile_id, action, entity_type, entity_id, metadata)
      values (
        auth.uid(),
        'project.created_from_contract',
        'project',
        v_project_id,
        jsonb_build_object('contract_id', new.id)
      );

      for v_step in
        select ps.id, ps.name, ps.description, ps.sla_days, ps.position
        from contract_item ci
        join playbook_step ps on ps.service_id = ci.service_id
        where ci.contract_id = new.id
        order by ci.id, ps.position
      loop
        insert into task (project_id, playbook_step_id, title, description, due_date, position)
        values (
          v_project_id,
          v_step.id,
          v_step.name,
          v_step.description,
          case when v_step.sla_days is not null then new.start_date + v_step.sla_days else null end,
          v_step.position
        );
      end loop;
    end if;

    if new.next_invoice_due_date is null then
      select coalesce(sum(quantity * unit_price_cents), 0) into v_monthly_total_cents
      from contract_item
      where contract_id = new.id and billing_type = 'recurring_monthly';

      if v_monthly_total_cents > 0 then
        v_due_day := case when extract(day from new.start_date) <= 15 then 10 else 25 end;
        new.next_invoice_due_date := (
          date_trunc('month', new.start_date::timestamp)
          + interval '1 month'
          + (v_due_day - 1) * interval '1 day'
        )::date;
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- Onda 2, Etapa Workflow.1 — quadro de demandas de conteúdo ("Workflow"),
-- nova aba dentro de Projetos. Cobre "aprovação de conteúdo e vídeo",
-- já prevista pro escopo da Onda 2.
--
-- Quadro separado do sistema de tarefas do playbook (task, Etapa 2.1) --
-- propósitos diferentes: task é checklist administrativo do serviço
-- vendido; content_demand é uma peça de conteúdo (post, arte, vídeo,
-- artigo) até ser publicada. "Aguardando aprovação" nesta etapa é
-- decidido manualmente por sócio/gestor (confirmando com o cliente por
-- fora do sistema) -- o cliente aprovar direto pelo sistema é a Etapa
-- Workflow.2, com login de cliente (ainda não existe nenhuma
-- infraestrutura disso hoje).

create type content_demand_status as enum (
  'draft',
  'in_production',
  'awaiting_approval',
  'approved_scheduled',
  'completed'
);

create table content_demand (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references client(id),
  title text not null,
  status content_demand_status not null default 'draft',
  assigned_to uuid references profile(id),
  channels text[] not null default '{}',
  scheduled_at timestamptz,
  briefing text,
  media_url text,
  tags text[] not null default '{}',
  created_by uuid not null references profile(id),
  approved_at timestamptz,
  approved_by uuid references profile(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_content_demand_client_id on content_demand(client_id);
create index idx_content_demand_status on content_demand(status);
create index idx_content_demand_assigned_to on content_demand(assigned_to);

create trigger content_demand_set_updated_at
  before update on content_demand
  for each row
  execute function set_updated_at();

alter table content_demand enable row level security;

-- Mesmo grupo de project/task: socio/gestor/colaborador leem (sem
-- financeiro); escrita completa só socio/gestor. Colaborador avança
-- status só da própria demanda, pela função abaixo (sem policy de
-- escrita direta), mesmo padrão de update_task_status.
create policy content_demand_select on content_demand
  for select using (auth_role() in ('socio', 'gestor', 'colaborador'));
create policy content_demand_write on content_demand
  for all using (auth_role() in ('socio', 'gestor'))
  with check (auth_role() in ('socio', 'gestor'));

grant select, insert, update, delete on content_demand to authenticated;

create function update_content_demand_status(
  p_demand_id uuid,
  p_status content_demand_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role;
  v_assigned_to uuid;
begin
  v_role := auth_role();
  if v_role not in ('socio', 'gestor', 'colaborador') then
    raise exception 'Sem permissão para alterar demandas' using errcode = 'insufficient_privilege';
  end if;

  select assigned_to into v_assigned_to from content_demand where id = p_demand_id;

  if not found then
    raise exception 'Demanda não encontrada' using errcode = 'no_data_found';
  end if;

  if v_role = 'colaborador' and (v_assigned_to is null or v_assigned_to <> auth.uid()) then
    raise exception 'Só o responsável pela demanda pode alterar o status' using errcode = 'insufficient_privilege';
  end if;

  update content_demand
  set status = p_status,
      approved_at = case
        when p_status = 'approved_scheduled' then coalesce(approved_at, now())
        else approved_at
      end,
      approved_by = case
        when p_status = 'approved_scheduled' then coalesce(approved_by, auth.uid())
        else approved_by
      end
  where id = p_demand_id;
end;
$$;

grant execute on function update_content_demand_status(uuid, content_demand_status) to authenticated;

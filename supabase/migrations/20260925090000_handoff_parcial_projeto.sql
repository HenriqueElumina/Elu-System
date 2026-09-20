-- Onda 1, Etapa 1.6 — Handoff parcial: criar projeto ao assinar contrato.
--
-- Handoff completo (tarefas do playbook, cobrança recorrente) depende dos
-- módulos de Tarefas (Onda 2) e Financeiro (Onda 1, ainda não construído)
-- -- ver ADR 0007. Esta etapa só cria a linha em `project`, pra existir um
-- registro do trabalho contratado assim que o contrato é assinado,
-- independente de ser via webhook do ZapSign ou troca manual de status.

-- Um projeto por contrato (contract_id nulo continua permitido -- unique
-- não bloqueia múltiplos NULLs).
alter table project
  add constraint project_contract_id_unique unique (contract_id);

create function handle_contract_signed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_client_name text;
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
    end if;
  end if;
  return new;
end;
$$;

create trigger contract_signed_creates_project
  after update on contract
  for each row
  execute function handle_contract_signed();

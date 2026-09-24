-- Etapa Workflow.4 — legenda da demanda de conteúdo, editável
-- separadamente do briefing (que é instrução de criação, não o texto
-- final do post).
alter table content_demand add column caption text;

-- Mesmo padrão de permissão de update_content_demand_status: sócio/gestor
-- sempre podem; colaborador só na própria demanda atribuída.
create function update_content_demand_caption(
  p_demand_id uuid,
  p_caption text
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
    raise exception 'Só o responsável pela demanda pode alterar a legenda' using errcode = 'insufficient_privilege';
  end if;

  update content_demand
  set caption = p_caption
  where id = p_demand_id;
end;
$$;

grant execute on function update_content_demand_caption(uuid, text) to authenticated;

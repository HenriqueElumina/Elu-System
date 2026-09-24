-- Etapa Workflow.5 — separa o link colado na criação da demanda
-- (material bruto, sem pré-visualização) do link que o editor cola ao
-- terminar a arte/vídeo (material final, com pré-visualização).
alter table content_demand add column final_media_url text;

-- Mesmo padrão de permissão de update_content_demand_caption: sócio/gestor
-- sempre podem; colaborador só na própria demanda atribuída.
create function update_content_demand_final_media(
  p_demand_id uuid,
  p_final_media_url text
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
    raise exception 'Só o responsável pela demanda pode alterar o material final' using errcode = 'insufficient_privilege';
  end if;

  update content_demand
  set final_media_url = p_final_media_url
  where id = p_demand_id;
end;
$$;

grant execute on function update_content_demand_final_media(uuid, text) to authenticated;

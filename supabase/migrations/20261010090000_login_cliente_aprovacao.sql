-- Etapa Workflow.2 — login de cliente e aprovação real de demandas.
--
-- Escopo confirmado com o dono do produto: só a aprovação de demandas do
-- Workflow (não o Portal do Cliente completo, que é Onda 3). Uma pessoa
-- específica do cliente recebe um convite (mesmo padrão do convite de
-- colaborador, Etapa 9.1) e vira um profile com role = 'cliente',
-- amarrado a um client_id -- primeira role com isolamento por registro,
-- em vez de acesso amplo.

alter table profile
  add column client_id uuid references client(id);

-- profile_select (Etapa 0.3) só deixa cada um ver a própria linha ou
-- sócio ver todas -- gestor não enxergaria quem já tem login de
-- cliente, mesmo podendo convidar. Policy adicional e restrita: só
-- perfis com role = 'cliente', nunca abre profile de colaborador/sócio/
-- financeiro pra gestor.
create policy profile_select_client_users on profile
  for select using (
    auth_role() in ('socio', 'gestor') and role = 'cliente' and client_id is not null
  );

alter table content_demand
  add column client_feedback text;

-- ---------------------------------------------------------------------------
-- client_user_invite: mesmo padrão de employee_invite (Etapa 9.1), mais
-- simples -- só e-mail + client_id, sem cargo/custo/admissão.
-- ---------------------------------------------------------------------------

create type client_user_invite_status as enum ('pending', 'submitted');

create table client_user_invite (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  status client_user_invite_status not null default 'pending',
  email text not null,
  client_id uuid not null references client(id),
  created_by_profile_id uuid not null references profile(id),
  invited_profile_id uuid references profile(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  submitted_at timestamptz
);

create index idx_client_user_invite_token on client_user_invite(token);
create index idx_client_user_invite_client_id on client_user_invite(client_id);

alter table client_user_invite enable row level security;

create policy client_user_invite_select on client_user_invite
  for select using (auth_role() in ('socio', 'gestor'));
create policy client_user_invite_insert on client_user_invite
  for insert with check (auth_role() in ('socio', 'gestor'));

grant select, insert on client_user_invite to authenticated;

-- ---------------------------------------------------------------------------
-- Funções públicas (SECURITY DEFINER): mesmo padrão do convite de
-- colaborador. submit_client_user_invite é o único lugar que promove um
-- profile recém-criado (que handle_new_user() sempre grava como
-- 'colaborador') para 'cliente' -- só acontece validando um token de
-- convite de verdade, com e-mail batendo.
-- ---------------------------------------------------------------------------

create function get_client_user_invite(p_token uuid)
returns table (valid boolean, reason text, email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite client_user_invite;
begin
  select * into v_invite from client_user_invite where token = p_token;

  if not found then
    return query select false, 'not_found', null::text;
  elsif v_invite.status = 'submitted' then
    return query select false, 'already_submitted', null::text;
  elsif v_invite.expires_at < now() then
    return query select false, 'expired', null::text;
  else
    return query select true, null::text, v_invite.email;
  end if;
end;
$$;

grant execute on function get_client_user_invite(uuid) to anon;

create function submit_client_user_invite(p_token uuid, p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite client_user_invite;
  v_profile_email text;
begin
  select * into v_invite from client_user_invite where token = p_token for update;

  if not found then
    raise exception 'Convite não encontrado' using errcode = 'no_data_found';
  elsif v_invite.status = 'submitted' then
    raise exception 'Este convite já foi respondido' using errcode = 'integrity_constraint_violation';
  elsif v_invite.expires_at < now() then
    raise exception 'Este convite expirou' using errcode = 'integrity_constraint_violation';
  end if;

  select email into v_profile_email from profile where id = p_profile_id;

  if v_profile_email is null then
    raise exception 'Perfil não encontrado' using errcode = 'no_data_found';
  elsif lower(v_profile_email) <> lower(v_invite.email) then
    raise exception 'O e-mail da conta não confere com o convite' using errcode = 'integrity_constraint_violation';
  end if;

  update profile
  set role = 'cliente', client_id = v_invite.client_id
  where id = p_profile_id;

  update client_user_invite
  set status = 'submitted', invited_profile_id = p_profile_id, submitted_at = now()
  where id = v_invite.id;
end;
$$;

grant execute on function submit_client_user_invite(uuid, uuid) to anon;

-- ---------------------------------------------------------------------------
-- content_demand: cliente só enxerga as próprias demandas aguardando
-- aprovação -- não o histórico completo (briefing/tags/responsável são
-- informação interna). Ação passa pelas funções abaixo, sem policy de
-- escrita direta (mesmo padrão de colaborador).
-- ---------------------------------------------------------------------------

create policy content_demand_select_cliente on content_demand
  for select using (
    auth_role() = 'cliente'
    and status = 'awaiting_approval'
    and client_id = (select client_id from profile where id = auth.uid())
  );

create or replace function update_content_demand_status(
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
  v_client_id uuid;
  v_current_status content_demand_status;
  v_caller_client_id uuid;
begin
  v_role := auth_role();
  if v_role not in ('socio', 'gestor', 'colaborador', 'cliente') then
    raise exception 'Sem permissão para alterar demandas' using errcode = 'insufficient_privilege';
  end if;

  select assigned_to, client_id, status into v_assigned_to, v_client_id, v_current_status
  from content_demand where id = p_demand_id;

  if not found then
    raise exception 'Demanda não encontrada' using errcode = 'no_data_found';
  end if;

  if v_role = 'colaborador' and (v_assigned_to is null or v_assigned_to <> auth.uid()) then
    raise exception 'Só o responsável pela demanda pode alterar o status' using errcode = 'insufficient_privilege';
  end if;

  if v_role = 'cliente' then
    select client_id into v_caller_client_id from profile where id = auth.uid();

    if v_caller_client_id is null or v_caller_client_id <> v_client_id then
      raise exception 'Sem permissão para alterar esta demanda' using errcode = 'insufficient_privilege';
    end if;

    if v_current_status <> 'awaiting_approval' or p_status <> 'approved_scheduled' then
      raise exception 'Só é possível aprovar uma demanda aguardando aprovação' using errcode = 'insufficient_privilege';
    end if;
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

-- "Pedir ajuste": só cliente, só na própria demanda aguardando aprovação,
-- volta pra "Em produção" com uma observação obrigatória pro responsável
-- interno entender o que precisa mudar.
create function request_content_demand_changes(p_demand_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_current_status content_demand_status;
  v_caller_client_id uuid;
begin
  if auth_role() <> 'cliente' then
    raise exception 'Só o cliente pode pedir ajuste' using errcode = 'insufficient_privilege';
  end if;

  if p_note is null or trim(p_note) = '' then
    raise exception 'Descreva o que precisa ser ajustado' using errcode = 'invalid_parameter_value';
  end if;

  select client_id, status into v_client_id, v_current_status
  from content_demand where id = p_demand_id;

  if not found then
    raise exception 'Demanda não encontrada' using errcode = 'no_data_found';
  end if;

  select client_id into v_caller_client_id from profile where id = auth.uid();

  if v_caller_client_id is null or v_caller_client_id <> v_client_id then
    raise exception 'Sem permissão para alterar esta demanda' using errcode = 'insufficient_privilege';
  end if;

  if v_current_status <> 'awaiting_approval' then
    raise exception 'Só é possível pedir ajuste em demanda aguardando aprovação' using errcode = 'insufficient_privilege';
  end if;

  update content_demand
  set status = 'in_production', client_feedback = p_note
  where id = p_demand_id;
end;
$$;

grant execute on function request_content_demand_changes(uuid, text) to authenticated;

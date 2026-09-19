-- Onda 1, Etapa 1.5 — Assinatura digital com ZapSign.

-- Quais dos itens padrão de "não inclusos" já estão dentro do escopo
-- deste contrato específico (para não aparecerem como "não incluso" no PDF).
alter table contract
  add column included_extras text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- update_contract_signature_status: única porta de entrada para o webhook
-- do ZapSign (que chega sem sessão logada, sem cookie de usuário). O
-- endpoint em /api/webhooks/zapsign já verifica o segredo compartilhado
-- antes de chamar esta função -- ela mesma só localiza o contrato pelo
-- token do documento assinado, não expõe a tabela `contract` a "anon".
-- ---------------------------------------------------------------------------

create function update_contract_signature_status(
  p_external_signature_id text,
  p_signature_status text,
  p_signed_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract_id uuid;
begin
  select id into v_contract_id
  from contract
  where external_signature_id = p_external_signature_id;

  if not found then
    raise exception 'Contrato não encontrado para este documento' using errcode = 'no_data_found';
  end if;

  update contract
  set
    signature_status = p_signature_status,
    signed_at = case when p_signature_status = 'signed' then coalesce(p_signed_at, now()) else signed_at end,
    status = case when p_signature_status = 'signed' then 'signed'::contract_status else status end
  where id = v_contract_id;

  insert into audit_log (actor_profile_id, action, entity_type, entity_id, metadata)
  values (
    null,
    'contract.signature_status_updated',
    'contract',
    v_contract_id,
    jsonb_build_object('signature_status', p_signature_status, 'source', 'zapsign_webhook')
  );
end;
$$;

grant execute on function update_contract_signature_status(text, text, timestamptz) to anon;

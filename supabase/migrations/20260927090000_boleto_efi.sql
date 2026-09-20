-- Onda 1, Etapa 1.8 — Financeiro: boleto via Efí.
--
-- Anexa um boleto de verdade a uma fatura já existente (Etapa 1.7). O
-- webhook da Efí chega sem sessão (mesma situação do ZapSign, Etapa 1.5):
-- segredo compartilhado na própria URL (`/api/webhooks/efi/[secret]`),
-- e o handler sempre reconsulta a cobrança na API antes de confiar no
-- status -- não dependemos de decifrar certo o esquema de assinatura
-- (X-Hub-Signature) da Efí pra ter segurança real.

alter table invoice
  add column external_charge_id text,
  add column boleto_barcode text;

create unique index idx_invoice_external_charge_id
  on invoice(external_charge_id)
  where external_charge_id is not null;

-- ---------------------------------------------------------------------------
-- update_invoice_payment_status: única porta de entrada do webhook da Efí.
-- Mapeamento defensivo: só "paid" e "canceled" mudam o status; qualquer
-- outro valor (ex.: "waiting", "identified") não altera nada -- evita
-- inventar significado pra status que eu não confirmei contra a API real.
-- ---------------------------------------------------------------------------

create function update_invoice_payment_status(
  p_external_charge_id text,
  p_status text,
  p_paid_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice_id uuid;
  v_new_status invoice_status;
begin
  select id into v_invoice_id
  from invoice
  where external_charge_id = p_external_charge_id;

  if not found then
    raise exception 'Fatura não encontrada para esta cobrança' using errcode = 'no_data_found';
  end if;

  v_new_status := case
    when p_status = 'paid' then 'paid'::invoice_status
    when p_status = 'canceled' then 'cancelled'::invoice_status
    else null
  end;

  if v_new_status is not null then
    update invoice
    set
      status = v_new_status,
      paid_at = case when v_new_status = 'paid' then coalesce(p_paid_at, now()) else paid_at end
    where id = v_invoice_id;

    insert into audit_log (actor_profile_id, action, entity_type, entity_id, metadata)
    values (
      null,
      'invoice.payment_status_updated',
      'invoice',
      v_invoice_id,
      jsonb_build_object('status', p_status, 'source', 'efi_webhook')
    );
  end if;
end;
$$;

grant execute on function update_invoice_payment_status(text, text, timestamptz) to anon;

-- Onda 1, Etapa 1.10 — Financeiro: conta bancária, baixa vinculada e
-- reversão de pagamento.
--
-- "Marcar como paga" (fatura ou conta a pagar) passa a exigir qual conta
-- bancária foi usada, e vira reversível ("baixa errada"). Diferente do
-- webhook da Efí (Etapa 1.8, sem sessão -- por isso SECURITY DEFINER),
-- estas ações sempre têm um usuário autenticado por trás, então as
-- funções abaixo são SECURITY INVOKER (padrão): a RLS de invoice/payable
-- continua valendo pra decidir quem pode chamar, e auth.uid() já é o
-- perfil de verdade.

create table bank_account (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bank_name text not null,
  agency text not null,
  account_number text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger bank_account_set_updated_at
  before update on bank_account
  for each row
  execute function set_updated_at();

alter table bank_account enable row level security;

-- Mesmo padrão de acesso do invoice/payable: socio tudo, financeiro
-- lê/escreve, gestor só lê, colaborador sem acesso.
create policy bank_account_select on bank_account
  for select using (auth_role() in ('socio', 'financeiro', 'gestor'));
create policy bank_account_write on bank_account
  for all using (auth_role() in ('socio', 'financeiro'))
  with check (auth_role() in ('socio', 'financeiro'));

grant select, insert, update, delete on bank_account to authenticated;

alter table invoice
  add column bank_account_id uuid references bank_account(id);

alter table payable
  add column bank_account_id uuid references bank_account(id);

-- ---------------------------------------------------------------------------
-- invoice: marcar como paga (com conta bancária) e reverter.
-- ---------------------------------------------------------------------------

create function mark_invoice_paid(p_invoice_id uuid, p_bank_account_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  update invoice
  set status = 'paid', paid_at = now(), bank_account_id = p_bank_account_id
  where id = p_invoice_id and status = 'pending';

  if not found then
    raise exception 'Fatura não encontrada ou não está pendente' using errcode = 'no_data_found';
  end if;

  insert into audit_log (actor_profile_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'invoice.marked_paid',
    'invoice',
    p_invoice_id,
    jsonb_build_object('bank_account_id', p_bank_account_id)
  );
end;
$$;

grant execute on function mark_invoice_paid(uuid, uuid) to authenticated;

create function revert_invoice_payment(p_invoice_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  update invoice
  set status = 'pending', paid_at = null, bank_account_id = null
  where id = p_invoice_id and status = 'paid';

  if not found then
    raise exception 'Fatura não encontrada ou não está paga' using errcode = 'no_data_found';
  end if;

  insert into audit_log (actor_profile_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'invoice.payment_reverted', 'invoice', p_invoice_id, null);
end;
$$;

grant execute on function revert_invoice_payment(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- payable: marcar como paga (com conta bancária) e reverter.
-- ---------------------------------------------------------------------------

create function mark_payable_paid(p_payable_id uuid, p_bank_account_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  update payable
  set status = 'paid', paid_at = now(), bank_account_id = p_bank_account_id
  where id = p_payable_id and status = 'pending';

  if not found then
    raise exception 'Conta a pagar não encontrada ou não está pendente' using errcode = 'no_data_found';
  end if;

  insert into audit_log (actor_profile_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'payable.marked_paid',
    'payable',
    p_payable_id,
    jsonb_build_object('bank_account_id', p_bank_account_id)
  );
end;
$$;

grant execute on function mark_payable_paid(uuid, uuid) to authenticated;

create function revert_payable_payment(p_payable_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  update payable
  set status = 'pending', paid_at = null, bank_account_id = null
  where id = p_payable_id and status = 'paid';

  if not found then
    raise exception 'Conta a pagar não encontrada ou não está paga' using errcode = 'no_data_found';
  end if;

  insert into audit_log (actor_profile_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'payable.payment_reverted', 'payable', p_payable_id, null);
end;
$$;

grant execute on function revert_payable_payment(uuid) to authenticated;

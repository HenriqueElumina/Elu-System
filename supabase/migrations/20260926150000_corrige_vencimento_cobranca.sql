-- Onda 1, Etapa 1.7 (correção) — regra real de vencimento da cobrança.
--
-- A migration anterior (20260926090000) agendava o primeiro vencimento
-- como "mesmo dia, um mês depois" (regra do ADR 0008). O dono do produto
-- corrigiu: contrato registrado do dia 1 ao 15 vence dia 10 do mês
-- seguinte; do dia 16 em diante (inclusive dia 31) vence dia 25. Como
-- ninguém tinha assinado contrato de verdade ainda (nenhuma fatura
-- gerada com a regra antiga), é só trocar a função -- sem dado pra migrar.

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

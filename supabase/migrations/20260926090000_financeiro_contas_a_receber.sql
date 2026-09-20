-- Onda 1, Etapa 1.7 — Financeiro: contas a receber (cobrança recorrente).
--
-- Fatura mensal (1 por contrato/mês) gerada automaticamente enquanto o
-- contrato estiver assinado/ativo -- via cron diário do Vercel chamando
-- generate_due_invoices(), mesmo padrão SECURITY DEFINER das etapas
-- anteriores (sem service_role key). NFSe, boleto/Pix de verdade (Etapa
-- 1.8) e contas a pagar (Etapa 1.9) ficam de fora.

create type invoice_status as enum ('pending', 'paid', 'cancelled');

create table invoice (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contract(id),
  client_id uuid not null references client(id),
  amount_cents integer not null,
  due_date date not null,
  status invoice_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint invoice_amount_cents_positive check (amount_cents > 0),
  -- 1 fatura por contrato/mês -- também a trava de idempotência do cron.
  constraint invoice_contract_due_date_unique unique (contract_id, due_date)
);

create index idx_invoice_contract_id on invoice(contract_id);
create index idx_invoice_client_id on invoice(client_id);

create trigger invoice_set_updated_at
  before update on invoice
  for each row
  execute function set_updated_at();

alter table invoice enable row level security;

-- Mesmo padrão de acesso do contract: socio tudo, financeiro lê/escreve
-- (dono da cobrança, docs/00-visao.md), gestor só lê, colaborador sem
-- acesso (dado financeiro sensível).
create policy invoice_select on invoice
  for select using (auth_role() in ('socio', 'financeiro', 'gestor'));
create policy invoice_write on invoice
  for all using (auth_role() in ('socio', 'financeiro'))
  with check (auth_role() in ('socio', 'financeiro'));

grant select, insert, update, delete on invoice to authenticated;

-- Próximo vencimento da cobrança recorrente deste contrato. Fica nulo até
-- o contrato ser assinado (ou se não tiver item de cobrança recorrente).
alter table contract
  add column next_invoice_due_date date;

-- ---------------------------------------------------------------------------
-- handle_contract_signed: estende a trigger da Etapa 1.6 (que já criava o
-- `project`) para também agendar o primeiro vencimento. Trocada de AFTER
-- para BEFORE update -- dá pra só atribuir em NEW em vez de fazer um update
-- recursivo na própria tabela dentro da trigger.
-- ---------------------------------------------------------------------------

drop trigger contract_signed_creates_project on contract;

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
        new.next_invoice_due_date := (new.start_date + interval '1 month')::date;
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger contract_signed_creates_project
  before update on contract
  for each row
  execute function handle_contract_signed();

-- ---------------------------------------------------------------------------
-- generate_due_invoices: alvo do cron diário do Vercel (via rota protegida
-- por CRON_SECRET, chamada com a chave anon). Gera toda fatura vencida e
-- ainda não criada, cobrindo atraso de vários meses numa única chamada se
-- o cron ficar fora do ar por um tempo.
-- ---------------------------------------------------------------------------

create function generate_due_invoices()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract record;
  v_monthly_total_cents integer;
  v_due_date date;
  v_invoice_id uuid;
begin
  for v_contract in
    select id, client_id, next_invoice_due_date
    from contract
    where status in ('signed', 'active')
      and next_invoice_due_date is not null
      and next_invoice_due_date <= current_date
      and deleted_at is null
    order by id
  loop
    select coalesce(sum(quantity * unit_price_cents), 0) into v_monthly_total_cents
    from contract_item
    where contract_id = v_contract.id and billing_type = 'recurring_monthly';

    v_due_date := v_contract.next_invoice_due_date;

    while v_due_date <= current_date loop
      if v_monthly_total_cents > 0 then
        insert into invoice (contract_id, client_id, amount_cents, due_date)
        values (v_contract.id, v_contract.client_id, v_monthly_total_cents, v_due_date)
        on conflict (contract_id, due_date) do nothing
        returning id into v_invoice_id;

        if v_invoice_id is not null then
          insert into audit_log (actor_profile_id, action, entity_type, entity_id, metadata)
          values (
            null,
            'invoice.generated',
            'invoice',
            v_invoice_id,
            jsonb_build_object('contract_id', v_contract.id, 'due_date', v_due_date)
          );
        end if;
      end if;

      v_due_date := (v_due_date + interval '1 month')::date;
    end loop;

    update contract
    set next_invoice_due_date = v_due_date
    where id = v_contract.id;
  end loop;
end;
$$;

grant execute on function generate_due_invoices() to anon;

-- ---------------------------------------------------------------------------
-- contract_receivable_summary: parcela, total do contrato (só quando tem
-- data de fim), pago e pendente -- pra tela /financeiro. security_invoker
-- faz a view respeitar a RLS de quem consulta, não de quem criou a view.
-- ---------------------------------------------------------------------------

create view contract_receivable_summary
with (security_invoker = true)
as
select
  c.id as contract_id,
  c.client_id,
  coalesce(cl.trade_name, cl.legal_name) as client_name,
  c.start_date,
  c.end_date,
  mt.monthly_total_cents as installment_amount_cents,
  case
    when c.end_date is not null then (
      select count(*)::integer
      from generate_series((c.start_date + interval '1 month')::date, c.end_date::timestamptz, interval '1 month')
    )
    else null
  end as total_installments,
  coalesce(paid.paid_count, 0)::integer as paid_installments
from contract c
join client cl on cl.id = c.client_id
join (
  select contract_id, sum(quantity * unit_price_cents)::integer as monthly_total_cents
  from contract_item
  where billing_type = 'recurring_monthly'
  group by contract_id
) mt on mt.contract_id = c.id
left join (
  select contract_id, count(*)::integer as paid_count
  from invoice
  where status = 'paid'
  group by contract_id
) paid on paid.contract_id = c.id
where c.next_invoice_due_date is not null
  and c.deleted_at is null;

grant select on contract_receivable_summary to authenticated;

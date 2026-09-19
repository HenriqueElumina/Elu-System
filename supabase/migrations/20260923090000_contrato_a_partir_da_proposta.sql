-- Onda 1, Etapa 1.4 — Contrato gerado a partir de uma proposta aceita.
-- Assinatura digital (ZapSign) e handoff automático ficam para as
-- Etapas 1.5 e 1.6.

alter table contract
  add column proposal_id uuid references proposal(id);

-- No máximo um contrato por proposta (nulo não conta -- contrato pode
-- nascer sem proposta em cenários futuros fora do escopo desta etapa).
create unique index idx_contract_proposal_id_unique
  on contract(proposal_id)
  where proposal_id is not null;

-- Etapa Leads.1 — arquivar e excluir leads, filtro por data de cadastro.
-- Excluir já usava lead.deleted_at (coluna existente desde a Etapa 1.3,
-- sem uso até aqui); arquivar é um estado à parte, pra não perder o
-- status (new/in_negotiation/won/lost) de um lead arquivado.

alter table lead add column archived_at timestamptz;

create index idx_lead_archived_at on lead(archived_at) where archived_at is not null;

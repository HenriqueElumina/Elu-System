# ADR 0024 — Excluir contratos arquivados e trocar status direto na lista

**Status:** Aceito — 2026-09-24

## Contexto

Etapa Contratos.2. Dois pedidos do dono do produto depois da Etapa
Contratos.1 (agrupamento por estágio): excluir contratos que já estão
em "Arquivados", e trocar o status de um contrato direto na tela que
lista todos, sem entrar no contrato.

## Decisões

### Sem campo novo no banco — "Arquivados" continua sendo o status

Perguntei se o dono do produto ainda queria o campo `archived_at`
separado (proposto na ADR 0023) ou se o status Cancelado/Encerrado já
bastava. Confirmado: só precisa do botão de excluir. Isso simplifica —
**sem migration nesta etapa**. `deleteContract` faz soft delete usando
o `contract.deleted_at` que já existia desde a Etapa 0.3, sem uso até
aqui (mesmo padrão do `lead.deleted_at` na Etapa Leads.1).

### Excluir só aparece na seção "Arquivados"

Trava de segurança: não dá pra excluir um contrato Vigente ou em
elaboração sem antes ele estar Cancelado ou Encerrado. O grupo
`STATUS_GROUPS` ganhou um flag `allowDelete`, só `true` pro grupo
"Arquivados".

### Trocar status na lista reaproveita a ação que já existia

`updateContractStatus` (Etapa 1.4) já revalidava `/contratos` e
`/contratos/[id]` — não precisou mudar. Criei um componente novo e
enxuto pra tabela (`status-select.tsx`, sem label, texto pequeno) em
vez de reaproveitar o `ContratoStatusChanger` da tela de detalhe (feito
pra um formulário maior, com label). A tela de detalhe não mudou.

### Sem mudança de RLS

A policy `contract_write` (`socio`/`gestor`) já cobria `UPDATE` —
suficiente tanto pra trocar status quanto pra soft delete.

## Validação

- `npm run lint`, `typecheck`, `test` (87 testes, sem novo — sem regra
  de negócio nova, RLS já existente cobre as duas ações) e `build` sem
  erro; Playwright completo sem erro (18 testes).
- Verificação visual (seletor de status em cada linha, botão Excluir só
  em Arquivados) com rota temporária e dados de exemplo, removida antes
  do commit.

## Consequências

- Sem histórico de quem mudou o status ou excluiu (sem `audit_log`) —
  mesmo padrão de outras ações administrativas que ainda não auditam.
- O seletor de status na lista permite qualquer transição (igual já
  acontecia na tela de detalhe) — sem máquina de estados travando, por
  exemplo, "Rascunho" pular direto pra "Encerrado".

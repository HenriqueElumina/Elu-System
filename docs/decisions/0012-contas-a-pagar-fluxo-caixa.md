# ADR 0012 — Financeiro: contas a pagar e fluxo de caixa básico

**Status:** Aceito — 2026-09-28

## Contexto

Etapa 1.9 da Onda 1, última fatia planejada do módulo Financeiro por
enquanto. Fecha o recorte do MVP (`docs/00-visao.md`, seção 3.4):
"contas a pagar simples (lançamento manual) e fluxo de caixa básico
(entradas e saídas)".

## Decisões

### Lançamento manual, sem automação

Diferente de `invoice` (Etapa 1.7, nasce sozinha do contrato assinado),
`payable` não tem nada por trás gerando linhas automaticamente — é
lançamento manual mesmo, confirmado com o dono do produto. Campos
mínimos: descrição, valor, vencimento, status (pendente/paga). Sem
categoria, fornecedor ou recorrência automática nesta etapa.

### Fluxo de caixa é só uma consulta, sem tabela nova

"Entrada" = `invoice` paga (`status = 'paid'`) no mês; "saída" =
`payable` paga no mês. Filtra por `paid_at`, não por `due_date` (fluxo
de caixa é sobre dinheiro que já entrou/saiu, não sobre o que está
previsto). O cálculo do resumo (total entrada, total saída, saldo) é
uma função pura testada (`computeCashFlowSummary`,
`lib/billing/cashflow.ts`) — a peça de "cálculo financeiro" que a regra
8 do `CLAUDE.md` exige testar.

### Mesmo padrão de acesso do `invoice`

`payable`: `socio` tudo, `financeiro` lê/escreve (dono das contas a
pagar, `docs/00-visao.md`), `gestor` só lê, `colaborador` sem acesso.
Tela de fluxo de caixa: mesmos três perfis leem (nada pra escrever ali,
é só leitura de `invoice`/`payable`).

## Validação

- Migration testada localmente (PostgreSQL 16, `SET ROLE authenticated`
  de verdade — metodologia fixada desde a Etapa 1.7): `financeiro` lança
  conta a pagar; `colaborador` não vê nada; `gestor` lê mas não escreve;
  revert limpo.
- `computeCashFlowSummary`/`monthRange` testados com Vitest (soma
  entrada/saída, saldo negativo, mês de 28/30/31 dias) — 71 testes no
  total no projeto.
- `npm run lint`, `typecheck` e `build` sem erro. Playwright:
  `/financeiro/contas-a-pagar` e `/financeiro/fluxo-de-caixa` exigem
  login.

## Consequências

- Sem conciliação bancária (via OFX, registrado no backlog desde a
  etapa de planejamento), sem categorias de despesa de verdade, sem DRE
  — tudo fora do MVP da Onda 1 (`docs/00-visao.md`).
- Contas a pagar recorrentes (ex.: aluguel todo mês) precisam ser
  lançadas manualmente todo mês por enquanto — se isso incomodar no uso
  real, é candidato a automação futura (registrar no backlog quando
  virar dor de verdade).
- Com esta etapa, o recorte do MVP do módulo Financeiro
  (`docs/00-visao.md`, seção 3.4) está completo, exceto NFSe (pendente
  de confirmação com o contador — bloqueante conhecido desde a Etapa
  0.1).

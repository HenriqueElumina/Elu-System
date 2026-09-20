# ADR 0010 — Financeiro: contas a receber (cobrança recorrente)

**Status:** Aceito — 2026-09-26

## Contexto

Etapa 1.7 da Onda 1. Primeira fatia do módulo Financeiro: gerar a
cobrança mensal recorrente sozinha a partir do contrato assinado (mesmo
espírito de handoff automático da Etapa 1.6), sem ainda emitir boleto/Pix
de verdade (Etapa 1.8) nem NFSe (pendente de confirmação com o contador,
`docs/backlog.md`).

## Decisões

### Data de fim do contrato passa a ser obrigatória

Sem saber quando o contrato termina não dá pra calcular quantas parcelas
ele tem no total -- e o dono do produto pediu explicitamente pra tela
mostrar valor total do contrato e valor remanescente (ex.: contrato de 12
meses de R$5.000 = R$60.000 total). `createContractSchema` agora exige
`endDate`. Contratos antigos que já tinham `end_date` em branco continuam
assim no banco (não inventei uma data pra eles); só ficam sem "total" e
"remanescente" na tela (mostra "sem prazo definido").

### Fatura gerada por um cron diário, não sob demanda

Não existe fila/job no sistema ainda (`CLAUDE.md`, seção 6, "a definir").
Optei por **Vercel Cron** (nativo da hospedagem já usada, sem serviço
novo) rodando 1x/dia às 09h (America/Sao_Paulo), chamando
`/api/cron/gerar-faturas`, protegida pelo `CRON_SECRET` que a própria
Vercel manda no cabeçalho `Authorization` -- convenção oficial deles.

### Geração de fatura em função `SECURITY DEFINER`, não em TypeScript

A rota do cron não tem sessão de usuário (mesma situação do webhook do
ZapSign), então não dá pra usar a chave `anon` pra ler `contract`
diretamente (RLS bloqueia). Toda a lógica -- decidir quais contratos têm
vencimento, gerar a fatura, avançar o próximo vencimento -- fica em
`generate_due_invoices()`, mesmo padrão das Etapas 1.5/1.6. A rota da API
só confere o `CRON_SECRET` e chama a função.

`contract.next_invoice_due_date` guarda o progresso: a trigger
`handle_contract_signed` (Etapa 1.6, agora `BEFORE UPDATE` em vez de
`AFTER` -- dava pra só atribuir em `NEW` sem precisar de um update
recursivo dentro da própria trigger) agenda o primeiro vencimento (1 mês
após a data do contrato, mesma regra da Etapa 1.5) só se o contrato tiver
item de cobrança recorrente. `generate_due_invoices()` gera toda fatura
vencida e ainda não criada -- inclusive cobrindo vários meses de atraso
numa única chamada, se o cron ficar fora do ar por um tempo.

### 1 fatura por contrato/mês, trava contra duplicata

`unique (contract_id, due_date)` em `invoice` -- garantia real contra
duplicata (a função também confere antes de inserir, mas a constraint é
quem garante de verdade sob concorrência).

### Total/remanescente calculados na consulta, não gravados

Em vez de guardar "número de parcelas" como campo redundante, uma view
(`contract_receivable_summary`, com `security_invoker` -- respeita a RLS
de quem consulta) calcula quantos vencimentos mensais cabem entre início
e fim do contrato (`generate_series`). O cálculo final (total, pendentes,
remanescente) vira uma função pura em TypeScript
(`computeReceivableSummary`, `lib/billing/receivable.ts`), testada com
Vitest -- é a peça de "cálculo financeiro" que a regra 8 do `CLAUDE.md`
exige testar.

### Acesso: mesmo padrão do `contract`

`invoice`: `socio` tudo, `financeiro` lê/escreve (dono da cobrança,
`docs/00-visao.md`), `gestor` só lê, `colaborador` sem acesso.

## Validação

- Migration testada localmente (PostgreSQL 16, stub do schema `auth`):
  contrato de 12 parcelas assinado agenda o primeiro vencimento certo;
  `generate_due_invoices()` gera 8 faturas atrasadas numa chamada só
  (catch-up) e não duplica ao rodar de novo; view calcula total/pago/
  remanescente certo; RLS por perfil testada com `SET ROLE authenticated`
  de verdade (não como superusuário -- ver nota abaixo); revert limpo.
- `npm run lint`, `typecheck`, `test` (52 testes, incluindo
  `computeReceivableSummary`) e `build` sem erro. Playwright:
  `/financeiro` exige login.

**Nota sobre o próprio processo de teste:** nas primeiras rodadas eu testei
como usuário `postgres` (superusuário), que **ignora RLS por padrão** --
isso mascarou um bug real (esqueci o `grant ... to authenticated` na
tabela `invoice`, sem o qual o Data API nem chega a avaliar a RLS).
Corrigido depois de reconectar com `SET ROLE authenticated` de verdade.
Fica registrado pra próximas etapas: testar RLS localmente sempre trocando
de role de verdade, nunca como superusuário.

## Consequências

- Boleto/Pix de verdade (Etapa 1.8) e contas a pagar/fluxo de caixa
  (Etapa 1.9) ficam de fora.
- Cancelar faturas pendentes automaticamente quando o contrato é
  cancelado não foi implementado (registrado no backlog).
- Depende de configurar `CRON_SECRET` na Vercel (variável nova) e de o
  plano de hospedagem permitir Cron Jobs -- Vercel Hobby permite só 1x/dia
  por projeto, que é exatamente o que esta etapa usa.

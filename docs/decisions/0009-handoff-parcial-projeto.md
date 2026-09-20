# ADR 0009 — Handoff parcial: criar projeto ao assinar contrato

**Status:** Aceito — 2026-09-25

## Contexto

Etapa 1.6 da Onda 1. Handoff completo venda→operação (CLAUDE.md, seção 9)
depende dos módulos de Tarefas (Onda 2) e Financeiro (Onda 1, ainda não
construído) — tarefas de onboarding a partir do playbook e cobrança
recorrente automática ficam de fora por enquanto (ver ADR 0007). Esta
etapa cobre só a parte que já dá pra fazer: nascer um registro de
`project` (tabela existente desde a Fundação, Etapa 0.3, mas nunca usada)
assim que o contrato é assinado.

## Decisões

### Trigger no banco, não lógica na aplicação

Um contrato pode virar `status = 'signed'` por dois caminhos: o webhook do
ZapSign (função `update_contract_signature_status`, Etapa 1.5) ou alguém
trocando o status manualmente na tela (`updateContractStatus`). Em vez de
duplicar "criar projeto" nos dois lugares, uma trigger
(`handle_contract_signed`, `AFTER UPDATE ON contract`) cuida disso duas
vezes: dispara sempre que `status` vira `'signed'`, não importa por onde.
Mesmo padrão de colocar automação crítica no banco já usado no projeto
(convite de cliente, Etapa 1.1; webhook do ZapSign, Etapa 1.5).

### Um projeto por contrato

`unique (contract_id)` em `project` — impede duplicata mesmo se a trigger
disparar mais de uma vez (ex.: o evento do ZapSign já dispara por
signatário). A trigger também confere `not exists` antes de inserir, mas
a constraint é a garantia de verdade contra concorrência.

### Nome do projeto = nome do cliente

Sem tela de edição de projeto ainda (fica pra quando a Onda 2 trouxer o
módulo de Tarefas e projetos de verdade), o nome nasce como
`coalesce(trade_name, legal_name)` do cliente. Decisão do dono do
produto: simples, e como cada projeto já é rastreável pelo contrato
vinculado, não precisa diferenciar por serviço no nome.

### Sem tela de projeto dedicada — link para o cliente

`/projetos` é só uma lista (nome, cliente, status, início). Cada linha
leva para `/clientes/[id]` (já existe desde a Etapa 1.1), não para uma
página de projeto própria — decisão do dono do produto: uma tela de
projeto de verdade (Kanban, tarefas, prazos) só faz sentido quando o
módulo de Tarefas existir; antes disso não haveria o que mostrar além do
que a lista já traz.

### Auditoria com ator opcional

A trigger grava em `audit_log` com `actor_profile_id = auth.uid()` —
preenchido quando alguém troca o status manualmente pela tela, `null`
quando vem do webhook (sem sessão), mesmo padrão da Etapa 1.5.

## Validação

- Migration testada localmente (PostgreSQL 16, com stub do schema `auth`
  do Supabase): contrato manual virando `signed` cria projeto com nome e
  data corretos e grava auditoria com o ator certo; chamada da função do
  webhook (contexto `anon`, sem sessão) também cria o projeto, com ator
  nulo; repetir a transição pra `signed` (mesmo valor, ou saindo e
  voltando) não duplica o projeto; revert (drop da trigger/função/
  constraint) limpo.
- `npm run lint`, `typecheck`, `test` (49 testes) e `build` sem erro.
- Playwright: `/projetos` exige login, mesmo padrão das outras telas.

## Consequências

- `/projetos` e o link na página do contrato só leem o que a trigger
  criou — nenhuma tela de criação/edição manual de projeto nesta etapa
  (não foi pedido; fica pro backlog quando fizer sentido).
- Quando a Onda 2 trouxer o módulo de Tarefas, a tela de projeto muda de
  "lista simples" pra página própria — ADR futura vai tratar essa
  transição, incluindo o handoff completo (tarefas do playbook, cobrança
  recorrente) mencionado na ADR 0007.

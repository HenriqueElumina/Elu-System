# ADR 0007 — Contrato gerado a partir da proposta

**Status:** Aceito — 2026-09-23

## Contexto

Etapa 1.4 da Onda 1. Escopo combinado com o dono do produto: gerar
contrato a partir de uma proposta aceita, sem assinatura digital ainda
(fica pra Etapa 1.5) e sem handoff automático (Etapa 1.6) — os módulos de
Tarefas e Financeiro, dos quais o handoff completo depende, ainda não
existem.

## Decisões

### Provedor de assinatura digital: ZapSign

Decisão pendente desde a ADR 0001/0003 (`docs/backlog.md`). Confirmado
com o dono do produto: **ZapSign**, pelo custo-benefício no volume atual
da Elumina. Só passa a valer na Etapa 1.5, quando a integração for
construída — esta etapa não usa a API do ZapSign ainda.

### `contract.proposal_id`: rastreabilidade, um contrato por proposta

Coluna nova, opcional (contrato pode nascer sem proposta em cenários
futuros fora do escopo atual) com índice único parcial — impede gerar
dois contratos a partir da mesma proposta.

### Lead precisa de `client_id` antes do contrato

`contract.client_id` é obrigatório (regra desde a Etapa 0.3), mas um lead
só tem dados soltos de contato, não os dados completos de cliente
(CNPJ, endereço). Por isso, gerar contrato exige que o lead já tenha um
cliente vinculado — a tela do lead ganhou um jeito de vincular um cliente
já cadastrado ou cadastrar um novo (reaproveitando a tela da Etapa 1.1),
que volta linkado automaticamente.

### Status do contrato editável à mão por enquanto

Sem assinatura digital ainda, o `socio`/`gestor` muda o status
(rascunho/enviado/assinado/ativo/cancelado/encerrado) manualmente. Isso
deixa de fazer sentido quando a Etapa 1.5 automatizar via webhook do
ZapSign — a tela já deixa esse aviso visível.

## Validação

- Migration testada localmente (PostgreSQL 16, por cima das 6 migrations
  anteriores): contrato gerado com itens copiados corretamente da
  proposta (preço + tipo de cobrança do catálogo), índice único
  bloqueando um segundo contrato pra mesma proposta, revert e
  reaplicação limpos.
- `npm run lint`, `typecheck`, `test` (36 testes) e `build` sem erro.
  Playwright confirma que `/contratos` exige login.

## Consequências

- A Etapa 1.5 (assinatura digital ZapSign) precisa: criar conta/API key
  no ZapSign (o dono do produto faz isso, como fez no Supabase), um
  endpoint de webhook idempotente com verificação de assinatura (regra 7
  do `CLAUDE.md`), e atualizar `signature_status`/`signed_at` no
  `contract` que já existe.
- A Etapa 1.6 (handoff parcial) cria só o `project` ao assinar — tarefas
  de onboarding e cobrança recorrente ficam registradas como pendência
  até os módulos de Tarefas e Financeiro existirem.

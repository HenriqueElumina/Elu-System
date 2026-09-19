# ADR 0006 — Comercial: pipeline de leads e propostas

**Status:** Aceito — 2026-09-22

## Contexto

Etapa 1.3 da Onda 1: primeira fatia do módulo Comercial. Escopo
combinado com o dono do produto: só lead e proposta. Contrato,
assinatura digital e o handoff automático (criar cliente/projeto/tarefas
a partir do playbook) ficam para a Etapa 1.4 — dependem de decisões
ainda pendentes (provedor de assinatura) e formam uma fatia própria.

## Decisões

### `lead` não referencia `client` obrigatoriamente

Um lead é um prospect — guarda os próprios dados de contato
(`company_name`, `contact_name`, `contact_email`, `contact_phone`), sem
exigir um `client_id`. `client_id` é opcional, usado quando o lead é
upsell de um cliente que já existe. Confirmado com o dono do produto:
todo negócio (novo ou upsell) passa pelo funil de lead — não existe
caminho de criar proposta direto pra um cliente sem lead.

### Estágios do funil: só 4, sem duplicar o status da proposta

`new` → `in_negotiation` → `won`/`lost`. O envio da proposta já tem seu
próprio status (`draft`/`sent`/`accepted`/`rejected`) — não existe um
estágio de lead tipo "proposta enviada", pra não duplicar informação.

### `lost_reason` como texto livre, opcional

Confirmado com o dono do produto: sem categorias fixas de motivo de
perda por enquanto — só um campo de texto, pensando em uso futuro do
módulo de CS (Onda 3).

### Preço do item da proposta copiado do catálogo, editável

Mesma lógica de `contract_item` (ADR 0002): `proposal_item.unit_price_cents`
é preenchido a partir de `service.base_price_cents` no momento em que o
serviço é escolhido na tela (auto-preenche, mas o campo é editável —
gestor negocia preço por proposta sem mudar o catálogo).

### Permissões: mesmo padrão de `contract`

`lead`, `proposal` e `proposal_item`: leitura para `socio`/`financeiro`/
`gestor`; escrita só `socio`/`gestor` — `financeiro` não edita comercial,
conforme `docs/00-visao.md`.

### Reescrever os itens da proposta inteiros a cada edição

Editar uma proposta apaga todos os `proposal_item` e insere de novo
(em vez de tentar diferenciar o que mudou linha a linha). Mais simples de
implementar e manter; aceitável porque não há histórico de mudança de
item a preservar nesta etapa.

## Validação

- Migration testada localmente (PostgreSQL 16, por cima das 5 migrations
  anteriores): sócio cadastra serviço no catálogo, gestor cria lead →
  proposta → item, muda status do lead pra "perdido" com motivo; RLS
  bloqueia `colaborador` de ler e escrever em `lead`; revert e
  reaplicação da migration, limpos.
- `npm run lint`, `typecheck`, `test` (32 testes) e `build` sem erro.
  Playwright confirma que `/leads` exige login.

## Consequências

- Sem PDF de proposta (já decidido desde a Etapa 0.2 — dados internos por
  enquanto).
- Sem geração automática de contrato ao aceitar uma proposta — isso é a
  Etapa 1.4.
- Sem notificação automática de mudança de estágio — se precisar (ex.:
  avisar sócio quando um lead for marcado "ganho"), fica pro módulo de
  automações (16), mais pra frente.

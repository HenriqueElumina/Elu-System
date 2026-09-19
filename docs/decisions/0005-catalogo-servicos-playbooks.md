# ADR 0005 — Catálogo de serviços e playbooks

**Status:** Aceito — 2026-09-21

## Contexto

Etapa 1.2 da Onda 1: telas para gerenciar o catálogo de serviços (a
tabela `service` já existia desde a Etapa 0.3, mas sem nenhuma tela) e o
playbook (etapas) de cada serviço.

## Decisões

### Correção de permissão: catálogo só é editável por sócio

Ao revisar `docs/00-visao.md` (seção 2, aprovada na Etapa 0.2), a policy
`service_write` escrita na Etapa 0.3 permitia `gestor` escrever também —
inconsistente com o documento, que define catálogo como leitura para
`gestor`. Corrigido nesta etapa (nova migration, sem alterar a antiga).

### `playbook_step` sem tabela `playbook` separada

Um serviço tem uma lista ordenada de `playbook_step` (nome, descrição,
SLA em dias) referenciando `service_id` direto — sem uma tabela `playbook`
intermediária. `docs/00-visao.md` já tinha marcado "versionamento
avançado de playbook" como fora do MVP, então um serviço = um playbook só
é suficiente por ora. Se precisarmos de múltiplas versões de playbook por
serviço no futuro, essa é a mudança de schema a fazer.

### "Checklist" interpretado como a lista de etapas, sem sub-itens

O mapa de módulos do `CLAUDE.md` fala em "etapas, checklists, SLAs e
templates de tarefa". Implementei como: a lista ordenada de
`playbook_step` já é o checklist. Não criei uma tabela de itens de
checklist dentro de cada etapa — se isso for necessário (múltiplos
sub-itens por etapa), fica para quando o módulo de Tarefas (Onda 2)
mostrar essa necessidade. Registrado em `docs/backlog.md`.

### Reordenação por troca de posição (sem drag-and-drop)

Mover etapa pra cima/baixo troca o campo `position` com a etapa vizinha
(duas chamadas sequenciais de update, sem transação explícita — risco
baixo, é reordenação de configuração interna, não dado transacional
sensível). Preferido a uma biblioteca de drag-and-drop, que seria uma
dependência nova sem necessidade clara nesta etapa.

### Preço em reais no formulário, centavos no banco

O formulário mostra e recebe o preço em reais (ex.: `2500.00`); a
conversão para centavos (`base_price_cents`) acontece no server action
(`lib/validation/service.ts`: `reaisToCents`/`centsToReais`), nunca no
banco. Mantém a regra de nunca guardar dinheiro como float.

## Validação

- Migration testada localmente (PostgreSQL 16, por cima das 4 migrations
  anteriores): sócio cria serviço e etapas; gestor lê ambos mas é
  bloqueado pelo RLS ao tentar criar serviço (erro esperado); revert e
  reaplicação da migration, limpos.
- `npm run lint`, `typecheck`, `test` (26 testes) e `build` rodando sem
  erro. Playwright confirma que `/servicos` exige login.

## Consequências

- Tela de detalhe do serviço (`/servicos/[id]`) mostra o formulário de
  edição só para `socio`; os demais perfis internos veem os dados em modo
  leitura, incluindo o playbook.
- Nenhuma automação ainda usa o playbook (a criação automática de tarefas
  a partir dele é do módulo de Tarefas, Onda 2, e do handoff
  venda→operação do módulo Comercial).

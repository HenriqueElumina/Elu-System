# ADR 0023 — Agrupar contratos por estágio (Etapa Contratos.1)

**Status:** Aceito — 2026-09-24

## Contexto

Pedido do dono do produto (mesmo espírito da Etapa Leads.1): ver
contratos agrupados por estágio — Aguardando elaboração / Pendente de
assinatura / Vigente / Arquivados — em vez de uma lista só, e mais
adiante poder excluir/arquivar contratos encerrados. Dividido em duas
etapas; esta é a primeira (só agrupamento visual, sem migration).

## Decisões

### Mapeamento dos 6 status atuais pros 4 grupos (confirmado com o dono do produto)

- **Aguardando elaboração** = Rascunho (`draft`)
- **Pendente de assinatura** = Enviado (`sent`)
- **Vigente** = Assinado (`signed`) + Ativo (`active`) — uma vez
  assinado, o handoff automático (Etapa 1.6) já criou o projeto; pra
  quem olha a lista, "assinado" e "ativo" são a mesma coisa na prática:
  contrato rodando.
- **Arquivados** (por enquanto) = Cancelado (`cancelled`) + Encerrado
  (`finished`) — usa só o `status` que já existe. Isso é temporário: na
  Etapa Contratos.2, "arquivado" vira um campo próprio (reversível,
  independente do status, mesmo padrão do `lead.archived_at`), porque o
  dono do produto confirmou que arquivar deve ser uma ação à parte
  ("só esconde da lista"), não o mesmo que mudar o status.

### Seções empilhadas, não Kanban lado a lado

Diferente dos Leads (cards simples), cada contrato tem 4 colunas de
dado (cliente, início, valor, status) — um Kanban de 4 colunas lado a
lado ficaria apertado demais pra tabela. Optei por 4 seções empilhadas,
cada uma com sua tabelinha e uma contagem entre parênteses no título.

### Sem mudança de banco, sem mudança de permissão

Mesma query de antes (`.is("deleted_at", null)`, mesmas colunas) — só
a apresentação mudou, agrupando o resultado em memória por `status`.
RLS e regra de quem acessa `/contratos` continuam as mesmas.

## Validação

- `npm run lint`, `typecheck`, `test` (87 testes, sem novo — não há
  regra de negócio nova aqui, só apresentação) e `build` sem erro;
  Playwright completo sem erro (18 testes).
- Verificação visual com uma rota temporária e dados de exemplo
  cobrindo os 6 status, removida antes do commit.

## Consequências

- Contratos Cancelados e Encerrados aparecem juntos em "Arquivados" por
  enquanto, mesmo que o dono do produto não tenha "arquivado" ativamente
  nenhum — isso muda na Etapa Contratos.2, quando "Arquivados" passa a
  refletir o campo novo em vez do status.
- Nenhuma ação nova (excluir/arquivar) nesta etapa — só a Etapa
  Contratos.2 adiciona isso.

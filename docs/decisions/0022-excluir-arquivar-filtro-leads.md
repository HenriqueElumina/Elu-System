# ADR 0022 — Excluir, arquivar e filtro por data em Leads

**Status:** Aceito — 2026-09-24

## Contexto

Pedido do dono do produto em `/leads`: conseguir excluir ou arquivar
leads, e um filtro de 30/60/90 dias — pra isso, mostrar a data e horário
de cadastro de cada lead.

## Decisões

### Excluir e arquivar são duas ações diferentes (confirmado com o dono do produto)

- **Excluir**: soft delete usando `lead.deleted_at` — coluna que já
  existia desde a Etapa 1.3 mas nunca tinha ação associada. Some da
  lista (ativa e arquivada), reversível só direto no banco. Mesmo
  padrão do resto do sistema (cliente, serviço, tarefa).
- **Arquivar**: coluna nova, `lead.archived_at`. Ficou separada de
  `deleted_at` de propósito — um lead arquivado mantém o `status`
  (`new`/`in_negotiation`/`won`/`lost`) intacto e pode ser desarquivado
  pela tela, voltando pro Kanban ativo exatamente como estava. Não virou
  um valor a mais no enum `lead_status` pra não misturar "onde o lead
  está no funil" com "isso ainda está sendo trabalhado ativamente".

### Sem mudança de RLS

A policy `lead_write` (`socio`/`gestor`) já cobre `UPDATE`, que é tudo
que excluir/arquivar precisam. Testado localmente: `socio` e `gestor`
conseguem arquivar/desarquivar/excluir; `financeiro` é bloqueado (RLS
recusa a atualização, mesmo comportamento de editar/mudar status de
lead, que já era restrito assim).

### Filtro de dias olha `created_at`

Confirmado com o dono do produto: "30/60/90 dias" mostra leads
cadastrados de N dias pra cá (não "leads parados há N dias"). Lógica
isolada em `lib/leads/date-filter.ts` (função pura `createdAfterCutoff`)
com teste — evita aritmética de data espalhada direto na tela.

### Tela `/leads`

- Kanban ativo continua igual, só que cada card agora mostra "Cadastrado
  em DD/MM/AAAA, HH:MM" e ganha os botões "Arquivar"/"Excluir" (só pra
  quem já gerencia lead hoje — `socio`/`gestor`; `financeiro` continua só
  vendo).
- Form de filtro por dias, GET simples (mesmo padrão já usado no Fluxo
  de caixa) — sem JS extra.
- "Ver arquivados" leva a uma lista separada (não Kanban, já que um lead
  arquivado pode estar em qualquer status) com "Desarquivar"/"Excluir".
- `/leads/[id]` (detalhe) ganhou só a data de cadastro no cabeçalho —
  resto da tela não mudou.

## Validação

- Migration testada localmente (PostgreSQL 16, `SET ROLE authenticated`
  de verdade): `socio` arquiva, `gestor` exclui, `financeiro` bloqueado
  nas duas ações; revert limpo (`drop column archived_at`).
- `npm run lint`, `typecheck`, `test` (87 testes, 5 novos pro filtro de
  data) e `build` sem erro; Playwright completo sem erro (18 testes).
- Verificação visual da tela (Kanban com data nos cards, botões, form de
  filtro) feita com uma rota temporária e dados de exemplo, removida
  antes do commit — sem login real contra o Supabase remoto disponível
  nesta sessão.

## Consequências

- Sem histórico de quem arquivou/excluiu (sem `audit_log`) — mesmo
  padrão de outras ações administrativas que ainda não auditam
  (registrado no backlog).
- Lead excluído não aparece nem na lista ativa nem na de arquivados —
  não existe tela de "lixeira".

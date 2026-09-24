# ADR 0028 — Workflow: visualização em lista e filtros (Etapa Workflow.3)

**Status:** Aceito — 2026-09-24

## Contexto

Pedido do dono do produto, com print de referência do mLabs mostrando duas
visualizações do mesmo quadro (Painel/Kanban e Lista, essa última ordenada
pela data de publicação) e uma barra de filtros (período, perfil/cliente,
status). Pedido explícito: "Podemos já criar outros filtros também? Como
por situação, por cliente, por colaborador responsável. Visualizar por
mês, por dia, por período personalizado, etc."

## Decisões

### Filtros e alternância de visualização na URL, sem tabela nova

Tudo em `/projetos/workflow`, via query string (`?view=lista&status=...&
client=...&assignee=...&period=...&from=...&to=...`), mesmo padrão já usado
no filtro de dias dos Leads e no seletor de mês do Fluxo de Caixa — um
formulário GET, sem JavaScript de cliente. Isso também dá o "link
compartilhável já filtrado" de graça. Sem migration: é a mesma consulta de
sempre em `content_demand`, só ganhando `where`s condicionais.

### Situação: multi-seleção por checkbox, "todos" marcados por padrão

Se nenhum checkbox vier na URL (primeira visita), trata como "todos
marcados" — comportamento atual preservado. Se o usuário desmarcar todos
manualmente e enviar, o formulário não manda o campo `status` nenhuma vez,
o que também cai em "sem filtro" (mostra tudo) em vez de "nada". Limitação
conhecida e aceita pela simplicidade — registrada no backlog.

### Cliente e Responsável: dropdown de valor único

Mesmas listas já usadas no formulário de nova demanda (`client` ativo,
`profile` com role sócio/gestor/colaborador e `active = true`).

### Período: atalhos (Hoje / Esta semana / Este mês) + personalizado

Um único `<select>` com os atalhos e a opção "Personalizado", mais dois
campos de data (De/Até) usados só quando "Personalizado" está selecionado.
Optamos por não esconder/mostrar os campos de data dinamicamente (exigiria
JavaScript de cliente) — eles ficam sempre visíveis, mas só têm efeito
quando o preset é "personalizado". Lógica pura e testada em
`lib/workflow/period-filter.ts` (`resolveWorkflowPeriod`): semana =
segunda a domingo da semana atual; mês = do dia 1 ao último dia do mês
atual; personalizado incompleto (só "De" ou só "Até") não filtra, em vez
de quebrar ou esconder tudo.

**Demanda sem data prevista sempre aparece** (confirmado com o dono do
produto), mesmo com um período selecionado — implementado com
`.or("scheduled_at.is.null,and(scheduled_at.gte...,scheduled_at.lte...)")`
no Supabase, em vez de um `.gte()/.lte()` direto (que excluiria nulos).

### Lista: mesmos 5 estágios, empilhados, ordenados por data prevista

Reaproveita as cores por estágio da atualização anterior (ADR 0027). Cada
grupo é uma tabela (Demanda, Cliente, Responsável, Canais, Publicação
prevista) ordenada por `scheduled_at` ascendente, sem data no fim — mesma
regra já usada nas tarefas do projeto (Etapa 2.4), extraída aqui como
função pura testada (`sortByScheduledAt`). Sem seletor de status inline na
lista (diferente do Painel) — pra mudar o status, ainda é preciso clicar na
demanda; mantém a tabela limpa e é consistente com o formato mais
informativo do mLabs.

### Fora de escopo, registrado no backlog

- Os ícones de checklist "Criação" (texto/design com check) do mLabs — não
  temos esse nível de granularidade hoje.
- Visualização "Cronograma"/calendário do mLabs.
- Combinação de checkboxes de situação que resulte em "nenhum selecionado
  de propósito" (hoje equivale a "todos").

## Validação

- `lib/workflow/period-filter.ts`: 12 testes novos (`parseWorkflowPeriodPreset`,
  `resolveWorkflowPeriod` — hoje, semana, mês, personalizado completo e
  incompleto — e `sortByScheduledAt`, incluindo o caso de itens sem data).
- `npm run lint`, `typecheck`, `test` (104 testes) e `build` sem erro;
  Playwright completo sem erro (20 testes, sem novo caminho protegido
  além dos já existentes — a tela continua a mesma rota).
- Verificação visual (Painel com filtros, Lista ordenada por data,
  filtro combinado de situação + cliente escondendo os grupos
  não selecionados) com rota temporária e dados de exemplo, removida
  antes do commit.

## Consequências

- Sem auditoria/histórico de qual filtro foi usado (não se aplica — é
  só leitura).
- Sem persistência de filtro entre sessões (cada visita começa em "sem
  filtro"; o link filtrado só persiste se salvo/compartilhado).

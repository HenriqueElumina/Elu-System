# ADR 0015 — Responsável, estimativa de horas e histórico de status da tarefa

**Status:** Aceito — 2026-10-01

## Contexto

Etapa 2.2, continuação do módulo de Tarefas (Etapa 2.1). Pedido do dono
do produto ao ver a tela `/projetos/[id]` pela primeira vez: aba de
responsável, "timer" de última alteração e tempo previsto de conclusão.

## Decisões

### Responsável restringe quem avança o status

`colaborador` só consegue chamar `update_task_status` na tarefa
atribuída a ele (`assigned_to = auth.uid()`); `socio`/`gestor` continuam
podendo mexer em qualquer tarefa. Escolha explícita do dono do produto,
em linha com a pergunta 2 do `CLAUDE.md` ("quem está sobrecarregado") —
sem responsável definido não tem como responder isso depois.

**Efeito colateral esperado:** as tarefas geradas na Etapa 2.1 (antes de
existir `assigned_to`) ficam sem responsável, e portanto bloqueadas pra
`colaborador` até alguém (`socio`/`gestor`) atribuir. Confirmado com o
dono do produto antes de implementar.

### "Tempo previsto" = estimativa de horas, sem cálculo ainda

`task.estimated_hours` (`numeric(6,2)`) é só captura de dado nesta
etapa — não alimenta nenhum cálculo de capacidade/rentabilidade ainda
(módulo 10, mais adiante). Prazo (`due_date`, da Etapa 2.1) e estimativa
de horas são conceitos diferentes: um é "quando precisa estar pronto", o
outro é "quanto trabalho isso deve levar" — os dois continuam existindo
lado a lado.

### Histórico de status em tabela própria, só escrita pela função

`task_status_history` (de/para, quem, quando) é gravada só dentro de
`update_task_status` — não tem policy de insert/update/delete pra
`authenticated`, só de leitura (mesmo grupo do `task`). Escolhido em vez
de "só mostrar `updated_at`" porque o dono do produto quis histórico de
verdade, não só a última mudança.

### Responsável só entre `socio`/`gestor`/`colaborador`; sem `freelancer`

O seletor de responsável (`socio`/`gestor` reatribuindo) só lista
perfis internos ativos. `freelancer` tem "acesso restrito a jobs
atribuídos" (`CLAUDE.md`, seção 5) que ainda não existe no sistema — dar
a ele uma tarefa aqui exigiria desenhar esse acesso restrito primeiro,
fora do escopo desta etapa. Registrado no backlog.

## Validação

- Migration testada localmente (PostgreSQL 16, `SET ROLE authenticated`
  de verdade): `colaborador` bloqueado numa tarefa sem responsável e
  numa atribuída a outra pessoa; `socio` atribui e define estimativa;
  `colaborador` responsável consegue avançar; `gestor` sempre consegue;
  `task_status_history` grava `from_status`/`to_status`/`changed_by`
  certos nas duas transições; `financeiro` não lê o histórico,
  `colaborador` lê; revert limpo.
- Vitest: `formatRelativeTime` (agora mesmo, minutos, horas, 1 dia
  singular, dias, meses) — 77 testes no total no projeto.
- `npm run lint`, `typecheck`, `build` e Playwright completo sem erro.

## Consequências

- `freelancer` como responsável de tarefa fica pra quando o acesso
  restrito dele existir (backlog).
- Sem alerta de atraso de prazo nem uso da estimativa de horas em
  nenhum cálculo — captura de dado agora, valor real vem quando o
  módulo 10 (capacidade/rentabilidade) existir.
- Reatribuir responsável ou mudar estimativa não fica no histórico
  (`task_status_history` só registra mudança de *status*) — se isso for
  necessário no futuro, é extensão da mesma tabela ou uma nova.

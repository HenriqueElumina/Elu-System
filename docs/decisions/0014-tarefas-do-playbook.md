# ADR 0014 — Tarefas nascendo do playbook do projeto

**Status:** Aceito — 2026-09-30

## Contexto

Etapa 2.1, primeira da Onda 2 (Operação). Fecha uma parte do handoff
automático venda→operação que ficou pendente desde a Etapa 1.6: quando
o projeto nasce (contrato assinado), gerar sozinho as tarefas a partir
do playbook de cada serviço vendido (Etapa 1.2).

## Decisões

### Tarefa é uma cópia (snapshot) do playbook_step, não uma referência viva

`task.title`/`task.description` são copiados do `playbook_step` no
momento da criação. Se o playbook do serviço for editado depois, as
tarefas de projetos já criados não mudam — cada projeto reflete o
processo como ele era quando a venda foi fechada. `playbook_step_id`
fica guardado só como rastro de origem.

### Prazo (`due_date`) = início do projeto + SLA da etapa do playbook

Etapa do playbook sem `sla_days` definido → tarefa sem prazo (`null`).
Sem alerta de atraso nesta etapa — isso é rentabilidade/capacidade
(módulo 10), mais adiante na Onda 2.

### Geração na mesma trigger que já cria o projeto

`handle_contract_signed()` (Etapas 1.6/1.7) ganhou um laço a mais, na
mesma transação: para cada `contract_item` do contrato, busca os
`playbook_step` do serviço correspondente e insere uma `task` por
etapa. Mantém a garantia de "venda fechada → projeto nasce pronto"
(princípio 1 do `CLAUDE.md`) inteiramente atômica — não tem como o
projeto existir sem as tarefas (ou vice-versa).

### Sem atribuição de responsável ainda

Ninguém "dono" da tarefa nesta etapa — qualquer `socio`/`gestor`/
`colaborador` pode avançar o status de qualquer tarefa de qualquer
projeto. Atribuição de responsável, Kanban visual e registro de tempo
ficam para as próximas fatias do módulo de Tarefas (mesma simplificação
já registrada no backlog para `client`/`project` e `colaborador`).

### `update_task_status`: colaborador não escreve direto na tabela

Igual ao padrão das faturas/contas a pagar (Etapa 1.10): `task_write`
(RLS) só permite `socio`/`gestor`. `colaborador` avança/reabre status
só por uma função `SECURITY DEFINER` (`update_task_status`) que checa o
perfil manualmente — mesma ideia de "porta estreita" das outras ações
sensíveis do sistema, mas aqui a checagem de perfil é feita dentro da
própria função (não pela RLS da tabela), porque `colaborador`
precisamente *não* tem `UPDATE` liberado na tabela `task`.

### Status simples: `pending` / `in_progress` / `done`

Sem Definition of Done (checklist dentro da tarefa) nesta etapa — só
avançar/reabrir o status da tarefa inteira. DoD por tarefa é módulo 5
do `CLAUDE.md`, mas fica pra quando o uso real mostrar que 3 estados
não bastam.

### Tela nova `/projetos/[id]`

Antes só existia a lista (`/projetos`, Etapa 1.6, leitura). Agora cada
projeto tem uma página própria: dados do projeto + lista de tarefas com
botões "Iniciar"/"Concluir"/"Reabrir". Fecha o item que já estava
registrado no backlog ("tela de projeto dedicada").

## Validação

- Migration testada localmente (PostgreSQL 16, `SET ROLE authenticated`
  de verdade): assinar um contrato novo gera projeto + uma tarefa por
  etapa do playbook do serviço, com `due_date` calculado certo
  (inclusive etapa sem SLA); `financeiro` não vê tarefas (sem policy de
  select); `colaborador` lê mas um `UPDATE` direto na tabela é
  silenciosamente bloqueado pela RLS (0 linhas afetadas, sem erro); só
  `update_task_status` deixa `colaborador` avançar o status; `gestor`
  também consegue; id inexistente dá erro controlado; revert (dropar
  tudo que a migration criou e devolver `handle_contract_signed` pra
  versão anterior) limpo.
- `npm run lint`, `typecheck` e `build` sem erro. Playwright:
  `/projetos/[id]` exige login (mesmo padrão do resto do sistema).

## Consequências

- **Contratos já assinados antes desta etapa não ganham tarefas
  retroativamente** — a geração só roda na transição de status pra
  `signed`, e esses contratos já estavam `signed` antes da migration.
  Se precisar gerar tarefas pra um projeto antigo, é uma ação manual
  (registrar caso a caso, não automatizado aqui).
- Sem atribuição de responsável, Kanban, registro de tempo, SLA com
  alerta de atraso ou Definition of Done — tudo registrado no backlog
  pras próximas fatias do módulo de Tarefas.
- Se um contrato tiver mais de um serviço (ex.: mídias sociais +
  audiovisual), as tarefas de cada serviço ficam juntas na mesma lista,
  na ordem em que os itens do contrato foram cadastrados — sem
  agrupamento visual por serviço ainda (considerar se a lista ficar
  confusa na prática).

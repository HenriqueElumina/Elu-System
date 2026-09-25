# ADR 0033 — Editar dados do projeto

**Status:** Aceito — 2026-09-25

## Contexto

Desde a Etapa 1.6, um `project` só nasce sozinho (trigger no contrato
assinado) e nunca ganhou edição própria — só o status, adicionado depois
na etapa "Projetos agrupados" (seletor inline em `/projetos`). Nome e
datas continuavam travados no valor de criação. O dono do produto pediu
essa etapa (item do backlog: "Editar dados do projeto (nome, status,
datas) — hoje só nasce automático").

## Decisões

### `end_date` é uma coluna nova

`project` só tinha `start_date` (nullable). Confirmado com o dono do
produto: adicionar `end_date` (nullable, sem trigger nem cálculo
automático), mesmo padrão que `contract.end_date` já tem desde a Etapa
1.7. Sem migração de dado — projetos existentes nascem com `end_date`
vazio.

### Sem mudança de RLS

`project_write` (Etapa 0.3) já libera `for all` (insert/update/delete)
pra `socio`/`gestor` em qualquer coluna — `updateProjectStatus` já
fazia update direto sem RPC. `updateProject` (nova action) segue o mesmo
padrão: update direto de `name`/`start_date`/`end_date`, sem função
`SECURITY DEFINER` nova. Validado localmente: gestor edita livremente,
colaborador é bloqueado (0 linhas afetadas, silencioso — mesmo
comportamento que o resto do módulo já tem).

### Um formulário só, na tela de detalhe

`EditProjectForm` (`app/projetos/[id]/edit-project-form.tsx`) reúne
nome, status (mesmo `<select>` de `StatusSelect`, mas chamando
`updateProjectStatus` separadamente do `updateProject` — são duas
tabelas/ações diferentes por trás, mas uma UX só) e as duas datas, atrás
de um botão "Editar projeto" — só visível pra `socio`/`gestor`
(`canManage`, mesma variável já usada pra tarefas). O seletor de status
solto que já existia em `/projetos` (lista) continua do jeito que
estava, sem mudança — essa etapa não mexeu nele.

### Validação: fim não pode ser antes do início

`editProjectSchema` (Zod, `lib/validation/project.ts`) rejeita
`endDate < startDate` quando as duas estão preenchidas. Testado em
`tests/project-schema.test.ts`.

## Validação

- `npm run typecheck`, `lint`, `test` (125 testes, 4 novos) e `build`
  sem erro.
- RLS testada localmente (Postgres 16, `elu_test`): gestor atualiza
  nome/datas; colaborador é bloqueado.
- Verificação visual do formulário (aberto, com os 4 campos) via rota
  temporária, removida antes do commit.
- Playwright completo (24 testes, sem novo — a mudança não afeta nenhum
  fluxo público/redirecionamento) sem erro.

## Consequências

- Sem histórico de mudança nessas edições (diferente de `task`, que tem
  `task_status_history`) — se o nome ou as datas mudarem, não fica
  registro de quem mudou nem de quando. Mesma simplificação já aceita em
  outras telas do projeto (sem auditoria ainda, item de backlog
  antigo).
- Editar o status por aqui ou pela lista em `/projetos` dá no mesmo —
  sem máquina de estados, mesma simplificação já registrada desde a
  etapa "Projetos agrupados".

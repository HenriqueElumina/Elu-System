# ADR 0016 — Registro de tempo (lançamento manual de horas)

**Status:** Aceito — 2026-10-02

## Contexto

Etapa 2.3, continuação do módulo de Tarefas. Colaborador precisa
registrar quanto tempo trabalhou em cada tarefa — primeira peça de dado
real de horas trabalhadas, que junto com `estimated_hours` (Etapa 2.2)
começa a preparar terreno pro módulo de capacidade/rentabilidade
(módulo 10).

## Decisões

### Lançamento manual, não timer ao vivo

Confirmado com o dono do produto: um cronômetro (iniciar/pausar) exigiria
lidar com timer esquecido rodando, sessão entre dispositivos, etc. —
complexidade sem necessidade clara ainda. Lançamento manual (data, horas,
nota opcional) é a versão mais enxuta que resolve a dor agora
("simples primeiro", `CLAUDE.md`).

### Mesma regra de permissão do status da tarefa (Etapa 2.2)

Só o responsável da tarefa ou `socio`/`gestor` lançam tempo nela — RLS
com `WITH CHECK` direto na tabela (não precisou de função
`SECURITY DEFINER` como `update_task_status`, porque aqui não tem lógica
extra além do próprio INSERT; a checagem cabe inteira na policy).
`profile_id` é sempre `auth.uid()` — não dá pra lançar tempo "em nome de
outra pessoa", nem `socio`/`gestor`.

### Corrigir = apagar (soft-delete) e lançar de novo

Confirmado com o dono do produto: sem edição em linha do valor. Só
`socio`/`gestor` apagam (soft-delete via `deleted_at`) um lançamento
errado; quem lançou não edita nem apaga depois — evita lançamento
"maquiado" retroativamente pela própria pessoa.

### Soma de horas é função pura testada

`sumLoggedHours` (`lib/tasks/time.ts`) segue o mesmo padrão de
`computeCashFlowSummary`/`computeReceivableSummary` — cálculo simples,
mas como é a base de um número que será usado pra decisões de negócio
mais adiante (capacidade), fica testado desde já.

## Validação

- Migration testada localmente (PostgreSQL 16, `SET ROLE authenticated`
  de verdade): `colaborador` lança na própria tarefa atribuída, bloqueado
  em tarefa de outro e ao tentar lançar em nome de outra pessoa; `gestor`
  lança em qualquer tarefa; `colaborador` não consegue soft-delete (0
  linhas afetadas, sem erro); `socio` soft-deleta; `financeiro` sem
  acesso de leitura; revert limpo.
- Vitest: `sumLoggedHours` (soma e lista vazia) — 79 testes no total no
  projeto.
- `npm run lint`, `typecheck`, `build` e Playwright completo sem erro.

## Consequências

- Sem uso da soma de horas em nenhum cálculo de capacidade/rentabilidade
  ainda — só exibição ao lado da estimativa (`Xh lançado` vs.
  `estimativa Yh`). Módulo 10 fica pra depois.
- Sem edição em linha do valor lançado — se isso incomodar no uso real
  (por exemplo, `socio`/`gestor` acharem chato apagar-e-relançar toda
  vez), é candidato a próxima fatia.
- `time_entry` não tem vínculo com `client`/`contract` diretamente — só
  com `task` (que já leva a `project` → `contract`). Pra relatório de
  horas por cliente, a consulta precisa passar por esse caminho.

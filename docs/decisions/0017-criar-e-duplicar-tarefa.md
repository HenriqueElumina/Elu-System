# ADR 0017 — Criar tarefa manual e duplicar tarefa existente

**Status:** Aceito — 2026-10-02

## Contexto

Etapa 2.4. O playbook (Etapa 2.1) cobre o processo padrão de cada
serviço, mas nem tudo cabe num template — o dono do produto pediu uma
forma de adicionar tarefas avulsas a um projeto, e de duplicar uma já
existente (útil pra tarefas recorrentes dentro do próprio projeto, sem
reescrever tudo).

## Decisões

### Sem migration — a RLS da Etapa 2.1 já cobre isso

`task_write` (`for all using (auth_role() in ('socio', 'gestor'))`) já
permite `INSERT` pra `socio`/`gestor` desde a Etapa 2.1 — só faltava a
tela. Confirmado com um teste direto no banco antes de escrever
qualquer código de aplicação (`colaborador` bloqueado, `socio`
consegue).

### Tarefa manual sem vínculo de playbook

`playbook_step_id` fica `null` — é uma tarefa avulsa, não finge ter
vindo de um template. Nasce com status "Pendente", sem responsável (o
`socio`/`gestor` atribui depois pelo editor já existente da Etapa 2.2).

### Duplicar copia dados, mas reseta status e responsável

Confirmado com o dono do produto: a cópia nasce "Pendente" e sem
responsável — fica pra alguém decidir quem pega essa nova tarefa, em
vez de herdar automaticamente de quem estava com a original. Título,
descrição, prazo e estimativa são copiados; `playbook_step_id` não é
copiado (mesma regra da criação manual — a cópia também é uma tarefa
avulsa, mesmo que a original tenha vindo do playbook).

### `position` só evita o `not null`, não ordena a lista

A tela já ordena por `created_at` (desde a Etapa 2.1), não por
`position` — esse campo só importa pra preservar a ordem das etapas
quando o playbook gera o lote inicial. Pra tarefa manual/duplicada,
`position` é só "quantidade atual de tarefas do projeto + 1", sem
significado além de satisfazer a coluna `not null`.

## Validação

- RLS confirmada direto no banco antes de escrever a tela: `colaborador`
  bloqueado ao tentar inserir tarefa manual; `socio` consegue.
- `npm run lint`, `typecheck`, `build` e Playwright completo sem erro.
  Sem teste de unidade novo — é CRUD simples sob a RLS já testada na
  Etapa 2.1, sem cálculo ou regra de negócio nova.

## Consequências

- Duplicar não copia lançamentos de tempo nem histórico de status (faz
  sentido — é uma tarefa nova, começando do zero).
- Sem reordenação manual da lista de tarefas (arrastar/soltar) — não foi
  pedido, e a lista já é cronológica.

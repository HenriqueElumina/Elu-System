# ADR 0002 — Modelagem de dados da Fundação

**Status:** Aceito — 2026-09-19

## Contexto

Etapa 0.3 (Onda 0): detalhar em schema SQL só as entidades da Fundação
(módulo 1), conforme `docs/00-visao.md` e o rascunho conceitual da seção 10
do `CLAUDE.md`.

## Decisões

### Perfil de acesso como enum, não tabela de permissões

`profile.role` é um enum fixo (`socio`, `financeiro`, `gestor`,
`colaborador`, `freelancer`, `cliente`), um perfil por pessoa. Alternativa
descartada por agora: tabela `role`/`permission` genérica com permissões
granulares por usuário. Motivo: os 6 perfis já cobrem o que o negócio
precisa hoje (regra de "simples primeiro" do `CLAUDE.md`, seção 9).

**Trade-off aceito:** se um dia alguém precisar de mais de um perfil ao
mesmo tempo, ou de permissão fina por usuário (além do perfil), a
modelagem muda para uma tabela de junção `profile_role` ou uma tabela de
permissões. Não é o caso hoje.

### `employee` separado de `profile`

`profile` é a conta de login + perfil de acesso. `employee` é o registro
"pessoa" que os módulos futuros de RH (9) e Capacidade/Rentabilidade (10)
vão referenciar (custo/hora, ausências, alocação). Manter os dois
separados desde já evita ter que migrar `time_entry`/`task` de uma FK para
`profile` para uma FK para `employee` mais tarde.

**Trade-off aceito:** hoje há redundância mínima (1 `employee` por
`profile` interno, sem dado próprio relevante ainda) — aceitável porque o
custo de manter é baixo e o custo de trocar depois seria maior.

### `contract_item` em vez de contrato = 1 serviço

Um contrato pode ter mais de um serviço (ex.: mídias sociais + audiovisual
no mesmo cliente). `contract_item` guarda preço e tipo de cobrança como
cópia do serviço no momento da venda, não como referência viva a
`service.base_price_cents` — para reajuste de preço no catálogo não
alterar valor de contratos já fechados.

### `audit_log` incluído na Fundação

O módulo 1 (Fundação) já lista "auditoria" no mapa de módulos do
`CLAUDE.md` (seção 3), e a regra de arquitetura (seção 8) exige log para
ações sensíveis (financeiro, contratos, permissões) — que já existem nesta
etapa (contratos, perfis). Por isso a tabela entra agora, imutável (sem
soft delete, sem policy de update/delete). A gravação efetiva de eventos é
responsabilidade da aplicação, a implementar nas etapas seguintes.

### RLS desde a Fundação, com simplificação assumida

RLS habilitado em todas as tabelas, com função `auth_role()` que lê o
perfil do usuário autenticado. Simplificação assumida: `colaborador` lê
todos os clientes/projetos, não só os que está alocado (isolamento por
alocação em projeto ainda não existe — chega com o módulo de Tarefas na
Onda 2). Registrado em `docs/backlog.md` para revisão futura.

### O que ficou fora desta etapa

`lead`, `proposal` (módulo 3 — Comercial), `invoice`/`payment`/`payable`
(módulo 4 — Financeiro), `task`/`time_entry` (módulo 5 — Tarefas),
`playbook`/`playbook_step` detalhado (módulo 2 — Catálogo). Entram quando
construirmos a etapa de cada módulo.

## Validação

Migration aplicada e testada localmente com PostgreSQL 16: inserts de
caminho feliz em todas as tabelas, violação de constraint (preço negativo,
data de fim antes da data de início) rejeitada como esperado, RLS
bloqueando acesso sem sessão autenticada, revert completo (drop de tabelas,
funções e tipos) e reaplicação da migration do zero sem erro.

## Consequências

- Próxima etapa (0.4, scaffold) precisa criar o projeto Supabase real e
  então testar RLS com usuários de perfis diferentes de fato (não só a
  simulação local desta etapa).
- Quando o módulo de Tarefas (Onda 2) existir, revisar as policies de
  `client` e `project` para filtrar por alocação do colaborador.

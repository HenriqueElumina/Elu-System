# ADR 0020 — Editar e desativar colaborador

**Status:** Aceito — 2026-10-05

## Contexto

Etapa 9.3. O dono do produto pediu duas coisas depois de usar a Etapa
9.1: excluir um colaborador, e editar cargo/custo-hora depois de
convidado (fecha um item que já estava registrado no backlog).

## Decisões

### "Excluir" virou "desativar" — apagar de verdade exigiria `service_role`

Apagar o login de alguém (`auth.users`) só é possível pela API admin do
Supabase, que exige a `service_role key` — nunca usada neste projeto
(ignora toda RLS, decisão de arquitetura desde a Etapa 0.4). Desativar
resolve o problema de verdade (a pessoa perde todo acesso) sem esse
risco, e é reversível — bate com a regra de soft delete do `CLAUDE.md`
("soft delete onde houver histórico relevante").

### Um lugar só bloqueia tudo: `auth_role()`

Em vez de adicionar `profile.active = true` em cada policy do sistema
(dezenas de tabelas), a checagem entrou dentro de `auth_role()` — a
função que praticamente toda policy já chama pra saber o perfil de quem
está logado. Perfil desativado → `auth_role()` devolve `null` → toda
policy `auth_role() in (...)` falha automaticamente. Uma função só
muda, sem tocar em nenhuma tabela nem policy existente.

### Cargo e custo/hora continuam em ações/RLS separadas

`updateEmployeeRoleTitle` escreve em `employee` (RLS: só `socio`,
inalterada desde a Etapa 0.3); `updateEmployeeCompensation` escreve em
`employee_compensation` (RLS: `socio`/`financeiro`, desde a Etapa 9.1).
A tela de edição só mostra o campo que aquele perfil pode mesmo salvar.

### Sócio não desativa a própria conta

Trava simples na `server action` (não na RLS): compara o `profile_id`
do colaborador com quem está logado antes de desativar. Evita alguém se
trancar fora do sistema sem querer — com só 2 sócios hoje, isso
travaria a administração do sistema inteiro.

### Middleware desloga e explica, não só bloqueia

A RLS via `auth_role()` já impede qualquer ação de um perfil
desativado, mas sozinha deixaria a pessoa numa tela quebrada (dados não
carregando, sem explicação). O middleware confere `profile.active` a
cada request autenticado e, se desativado, desloga e manda pro login
com um aviso claro.

## Validação

- Migration testada localmente (PostgreSQL 16, `SET ROLE authenticated`
  de verdade): perfil ativo lê `employee` normalmente; depois de
  `profile.active = false`, o mesmo perfil perde acesso a `employee` **e
  também a `client`** (confirma que a trava é do sistema inteiro, não só
  de RH); reativado, volta a funcionar; revert limpo.
- `npm run lint`, `typecheck`, `build` e Playwright completo sem erro
  (18 testes). Sem teste de unidade novo — a lógica nova é RLS (testada
  direto no banco) e CRUD simples sob RLS já existente.

## Consequências

- A trava de "sócio não desativa a si mesmo" é só na `server action` —
  alguém mexendo direto no banco (SQL Editor do Supabase) ainda
  consegue. Aceitável: é o mesmo nível de confiança que já existe pra
  qualquer ação administrativa direta no banco.
- Login técnico de alguém desativado continua existindo no Supabase
  Auth (só sem nenhum acesso) — não é uma exclusão de dados pessoais
  (LGPD). Se um dia for pedido "apagar os dados de alguém que saiu",
  isso é uma etapa própria, fora do escopo daqui.
- Sem histórico de quem desativou/reativou quem (sem `audit_log`) —
  registrado no backlog, mesmo padrão de outras ações administrativas
  que ainda não gravam auditoria (`updateContractStatus`, por exemplo).

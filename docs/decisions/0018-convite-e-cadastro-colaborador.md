# ADR 0018 — Colaboradores (RH): convite e cadastro básico

**Status:** Aceito — 2026-10-03

## Contexto

Etapa 9.1, primeira etapa do módulo 9 (Colaboradores/RH), dentro da
Onda 2. Até aqui `employee` existia desde a Etapa 0.3 (registro
mínimo), mas sem nenhuma tela — colaboradores eram criados direto no
painel do Supabase. Esta etapa cobre: convidar um colaborador novo
(com login de verdade) e cadastrar cargo/custo-hora/admissão.
Formulário de onboarding com dados pessoais (contato de emergência,
restrição alimentar, objetivos etc.) fica pra Etapa 9.2.

## Decisões

### Correção de segurança: `role` do cadastro nunca mais vem do cliente

`handle_new_user()` (Etapa 0.4) lia `role` de `raw_user_meta_data`,
controlado por quem se cadastra. Isso nunca foi explorável porque não
existia formulário público de cadastro no app. Esta etapa muda isso
(auto-cadastro pelo link de convite é, pela primeira vez, um caminho
sancionado), então travei: **todo auto-cadastro nasce `colaborador`,
sem exceção**, ignorando qualquer `role` que venha no payload do
`signUp`. Promoção continua sendo manual, só por `socio`, via a mesma
policy `profile_update` que já existia. Sem isso, qualquer pessoa com a
chave anônima (pública, embutida no site) poderia chamar a API de
cadastro do Supabase diretamente e se registrar como `socio`.

### Colaborador cria a própria senha — sem `service_role`

Diferente do convite de cliente (que só captura dados, sem login), um
colaborador precisa de conta de verdade. A pessoa convidada usa
`auth.signUp` (chave anônima, do navegador dela) — nunca a API admin
do Supabase, que exigiria `service_role` (regra do projeto desde o
início: nunca usar essa chave). O e-mail vem travado do convite (campo
somente leitura no formulário), pra evitar alguém usar o link com outro
e-mail; `submit_employee_invite` confere de novo no banco antes de
materializar o cadastro.

### Fluxo em duas etapas, sem transação única entre Auth e Postgres

1. `socio`/`financeiro` cria `employee_invite` (e-mail, cargo, custo/hora,
   admissão) — gera um link.
2. A pessoa convidada abre o link, define nome e senha; o navegador dela
   chama `auth.signUp` (cria a conta — dispara `handle_new_user`, que
   cria `profile`) e, em seguida, `submit_employee_invite(token,
   profile_id)` (`SECURITY DEFINER`) — que só então cria `employee` e,
   se houver custo/hora no convite, `employee_compensation`.

**Consequência aceita:** como `auth.signUp` e o `submit_employee_invite`
são duas chamadas separadas (a autenticação do Supabase não participa
da transação do Postgres), se a segunda falhar depois da primeira ter
funcionado, fica um `profile` sem `employee` correspondente — um caso
raro (ex.: convite expirou nos segundos entre uma chamada e outra) que
exigiria conserto manual. Registrado no backlog.

### Custo/hora em tabela separada, não em `employee`

`employee_compensation` (não `employee.hourly_cost_cents`) — RLS restrita
a `socio`/`financeiro` (conforme sua decisão), diferente da leitura ampla
de `employee` (`socio`/`financeiro`/`gestor`/`colaborador`, que já
existia desde a Etapa 0.3). RLS é por linha, não por coluna — juntar os
dois na mesma tabela vazaria custo/hora pra quem só devia ver
nome/cargo/admissão. Mesmo padrão já usado pra `bank_account` (Etapa
1.10): dado sensível isolado numa tabela própria.

### Convite só por `socio`/`financeiro`

Consequência direta de o formulário de convite já incluir custo/hora —
não faz sentido a tela de convite ser mais aberta que o próprio dado que
ela captura. `gestor` não convida nesta etapa (registrado no backlog,
caso incomode no uso real).

## Validação

- Migration testada localmente (PostgreSQL 16, `SET ROLE authenticated`/
  `anon` de verdade): cadastro forjado com `role: socio` no metadata
  nasce `colaborador` mesmo assim; `gestor` bloqueado ao criar convite;
  `financeiro` consegue; fluxo completo (`get_employee_invite` →
  `auth.signUp` simulado → `submit_employee_invite`) cria `employee` +
  `employee_compensation` certos; segunda submissão do mesmo convite
  barrada; e-mail que não bate com o convite barrado;
  `employee_compensation` só `socio`/`financeiro` leem, `gestor`
  bloqueado; `employee` continua de leitura ampla (cargo/admissão
  visíveis pra `colaborador`, custo não); revert limpo.
- `npm run lint`, `typecheck`, `build` e Playwright completo sem erro
  (16 testes). `/colaboradores`, `/colaboradores/convidar` exigem login;
  `/convite-colaborador/[token]` é pública.

## Consequências

- Sem tela de editar colaborador depois de convidado (cargo, custo,
  desativar) — só nasce pelo convite. Fica pra próxima fatia.
- Sem reenvio de convite expirado/perdido — tem que gerar um novo link.
- `gestor` não convida (só vê a lista, sem custo) — registrado no
  backlog caso precise mudar.
- Onboarding com dados pessoais (Etapa 9.2) ainda não tem os campos
  exatos definidos — fica pra quando formos desenhar essa etapa.

# ADR 0032 — Link direto de aprovação pro cliente

**Status:** Aceito — 2026-09-25

## Contexto

Depois da Etapa Workflow.2 (login de cliente), o dono do produto pediu que
sócio/gestor consigam mandar diretamente um link de uma demanda específica
pro cliente aprovar — em vez de só avisar "entra no sistema e vê lá".
Investigando essa mudança, achei um bug real na Workflow.2 que precisava
ser corrigido pra essa etapa fazer sentido: o formulário de login sempre
mandava todo mundo pra `/clientes`, ignorando o perfil — um cliente
logando pela tela normal caía em "Acesso não autorizado" em vez de
`/portal`. O redirecionamento por perfil só existia no middleware, que só
é acionado nesse ponto quando alguém abre `/login` já autenticado (não no
fluxo normal de login, que navega direto pelo lado do cliente).

## Decisões

### Correção do bug: login por perfil de verdade

`app/login/page.tsx` — depois de `signInWithPassword` ter sucesso, busca
a role do perfil recém-logado e decide o destino (`cliente` → `/portal`,
resto → `/clientes`), em vez do `router.replace("/clientes")` fixo que
existia desde a Etapa 0.4/9.1. Esse é o caminho de verdade usado no dia a
dia — a lógica que já existia no middleware (`user && isLoginPage`)
continua, mas cobre só o caso raro de abrir `/login` já com sessão ativa.

### `/portal/[id]`: aprovação de uma demanda só

Nova tela, mesma RLS de sempre (`content_demand_select_cliente` já
garante isolamento — se a demanda não voltar da consulta é porque não é
do cliente, já foi decidida, ou o link está errado). Reaproveita o mesmo
`DemandCard` da lista (`/portal`), sem duplicar a lógica de
Aprovar/Pedir ajuste. Lógica de formatação (canais, data) extraída pra
`app/portal/format.ts`, compartilhada entre a lista e a demanda única.

### "Copiar link para o cliente": sócio/gestor e o responsável atribuído

Confirmado com o dono do produto: o mesmo grupo que já vê `StatusSelect`
na tela (`canAct` — sócio/gestor sempre, colaborador só na própria
demanda atribuída) também vê o botão novo, em vez de restringir só a
sócio/gestor. Componente client-side simples
(`copy-client-link-button.tsx`): copia `origin/portal/<id>` pra área de
transferência, com um `prompt()` como reserva se a API de clipboard
falhar (contexto não seguro, permissão negada).

### Link sobrevive ao login: `next` param

Pra o link mandado pro cliente realmente levar direto pra demanda (e não
pra tela de login sem destino, ou pra lista inteira depois de logar):

- Middleware: ao redirecionar visitante não autenticado pra `/login`,
  agora sempre grava `?next=<pathname original>`.
- `app/login/page.tsx`: depois do login bem-sucedido, se `next` estiver
  presente e for um caminho interno seguro (`começa com "/"`, não
  `"//"` — evita redirecionamento pra domínio externo), vai pra lá em
  vez do destino padrão do perfil.
- Middleware (`user && isLoginPage`): mesma prioridade, pro caso raro de
  abrir o link já autenticado.

Isso também melhora qualquer outro link direto que a agência queira
mandar no futuro (não é exclusivo do Workflow) — mas o uso concreto desta
etapa é só a aprovação de demanda.

### Testes e2e: `/login$` virou `/login` (sem `$`)

Como o middleware agora sempre acrescenta `?next=...` ao redirecionar
visitante não autenticado, os testes que verificavam `toHaveURL(/\/login$/)`
(âncora de fim de string, sem query string) quebrariam em todo o app —
16 arquivos de teste ajustados pra `/\/login/` (sem âncora). Exceção: o
teste de "credenciais inválidas" em `login.spec.ts`, que visita `/login`
direto (sem passar pelo redirecionamento), continua com o match exato.

## Validação

- `npm run lint`, `typecheck`, `test` (121 testes, sem novo — a mudança é
  só de rota/redirecionamento) e `build` sem erro; Playwright completo
  sem erro (24 testes, 1 novo — `/portal/[id]` exige login e preserva o
  destino no `next`).
- Verificação visual (botão "Copiar link para o cliente" ao lado do
  seletor de status, mudando pra "Link copiado!" após o clique) com rota
  temporária, removida antes do commit.

## Consequências

- O link só funciona se o cliente já tiver conta (criada pelo convite da
  Workflow.2) — não é um "magic link" sem senha. Se a agência mandar o
  link antes de convidar o login, a pessoa cai no login sem credencial
  nenhuma. Fora de escopo por enquanto.
- Sem aviso automático (e-mail/WhatsApp) quando o link é copiado — a
  agência ainda manda manualmente por fora do sistema. Mesma pendência
  já registrada no backlog desde a Workflow.2.

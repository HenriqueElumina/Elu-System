# ADR 0003 — Scaffold do projeto

**Status:** Aceito — 2026-09-19

## Contexto

Etapa 0.4 (Onda 0): criar o projeto base (Next.js + TypeScript, auth,
perfis, layout, migrations, testes, CI) e a primeira tela funcional
protegida por perfil (`/clientes`).

## Decisões

### Versões: Next.js 16 / React 19 / ESLint 9, não as versões da ADR 0001

A ADR 0001 propôs Next.js 14/15-era genericamente. Como o projeto nasce
agora, usei as versões estáveis mais recentes disponíveis (Next.js 16.3.5,
React 19.3.0, ESLint 9) em vez de fixar versões antigas — `npm install`
com as versões inicialmente propostas trazia 7 vulnerabilidades conhecidas
(XSS/path traversal em ferramentas de build) sem correção não-destrutiva
disponível; subir para as versões atuais zerou as vulnerabilidades.

### `middleware.ts` → `proxy.ts`

O Next.js 16 renomeou a convenção de arquivo `middleware` para `proxy`
(mesma função, nome novo). Segui a convenção nova desde já, para não
nascer com um recurso já marcado como depreciado.

### ESLint: config flat nativa do `eslint-config-next`, sem `FlatCompat`

A partir da versão instalada, `eslint-config-next` já exporta a config
flat diretamente (`eslint.config.mjs` importa e usa o array exportado).
Usar o padrão antigo (`FlatCompat.extends(...)`, pensado para adaptar
configs `.eslintrc` legadas) quebrava com um erro de estrutura circular,
porque o pacote não é mais um config legado por baixo.

### RLS: grants explícitos para `authenticated`

Como o projeto Supabase foi criado com "Automatically expose new tables"
desligado (decisão de segurança, ver o histórico desta conversa), o Data
API não enxerga nenhuma tabela nova por padrão. A migration
`20260919130000_profile_signup_trigger_and_grants.sql` concede
`select/insert/update/delete` ao papel `authenticated` em cada tabela da
Fundação — o RLS já criado na Etapa 0.3 continua sendo a proteção
linha-a-linha. Nada é concedido a `anon`: todo acesso exige login.

### Criação automática de `profile` no signup

Trigger `handle_new_user` em `auth.users` cria a linha em `profile`
automaticamente, com perfil padrão `colaborador` (ou o perfil vindo de
`raw_user_meta_data->>'role'`, quando informado — útil para quando o fluxo
de convite existir, no módulo de RH). Evita ter que inserir a linha à mão
toda vez que alguém for criado no Supabase Auth.

### Sem cadastro público

Só existe tela de login. Primeiro usuário (sócio) é criado direto no
painel do Supabase; o fluxo de convite de colaboradores fica para o
módulo de RH (Onda 2). Coerente com ser uma ferramenta interna.

### UI sem shadcn/ui por enquanto

A ADR 0001 previa Tailwind + shadcn/ui. Nesta etapa usei componentes
simples escritos à mão com classes Tailwind (formulário de login, tabela
de clientes), sem rodar o CLI do shadcn/ui (que baixa componentes de um
registry externo). Simplificação deliberada para não depender de acesso
de rede a um serviço externo no meio do scaffold — registrado em
`docs/backlog.md` para rodar o `shadcn` CLI numa próxima etapa de UI, sem
precisar reescrever o que já existe (são só classes Tailwind).

## Validação

- `npm run lint`, `npm run typecheck`, `npm test` (7 testes, Vitest) e
  `npm run build` rodando limpo, sem erros.
- `npm run test:e2e` (Playwright, Chromium real, headless): confirma que
  um visitante não autenticado é redirecionado para `/login`, e que um
  login com credenciais inválidas chama a API real do Supabase (projeto já
  criado) e mostra erro sem navegar — valida a conexão de ponta a ponta
  com as credenciais reais do projeto, mesmo antes de aplicar as
  migrations nele.
- As migrations da Fundação (Etapa 0.3) e desta etapa foram testadas
  localmente com PostgreSQL simulando o `auth` do Supabase (ver ADR 0002)
  -- ainda não foram aplicadas no projeto Supabase real, porque isso exige
  acesso que só o dono do produto tem (senha do banco). Passo a passo em
  `README.md`.

## Consequências

- Login e a tela `/clientes` só funcionam de fato depois que o dono do
  produto aplicar as duas migrations no projeto Supabase e criar o
  primeiro usuário (passo a passo no `README.md`).
- CI (`\.github/workflows/ci.yml`) roda lint/typecheck/testes unitários a
  cada push; o Playwright (`test:e2e`) não entrou no CI ainda porque
  precisaria das credenciais do Supabase como secret do GitHub Actions --
  registrado em `docs/backlog.md`.

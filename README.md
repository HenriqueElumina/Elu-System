# Elu System

Sistema interno da Elumina Partners. Ver `CLAUDE.md` para contexto completo
do produto e as regras de trabalho, e `docs/` para as decisões e o modelo
de dados.

## Stack

Next.js (App Router) + TypeScript, Supabase (Postgres + Auth + RLS),
Tailwind CSS. Ver `docs/decisions/0001-stack-e-decisoes-fundacionais.md`.

## Setup local

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar o projeto Supabase

1. Copie `.env.example` para `.env.local`.
2. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com
   os valores de **Project Settings → API** do seu projeto Supabase.

### 3. Aplicar as migrations no Supabase

No painel do Supabase, vá em **SQL Editor → New query** e rode, **nesta
ordem**, o conteúdo de cada arquivo:

1. `supabase/migrations/20260919120000_foundation_schema.sql`
2. `supabase/migrations/20260919130000_profile_signup_trigger_and_grants.sql`

### 4. Criar o primeiro usuário (sócio)

1. **Authentication → Users → Add user → Create new user**, com seu e-mail
   e uma senha, marcando **Auto Confirm User**.
2. Isso cria automaticamente uma linha em `profile` com perfil
   `colaborador` (o trigger da migration 2 faz isso). Promova para `socio`
   rodando no **SQL Editor**:

   ```sql
   update profile set role = 'socio' where email = 'seu-email@eluminapartners.com.br';
   ```

### 5. Rodar o app

```bash
npm run dev
```

Acesse `http://localhost:3000` — deve redirecionar para `/login`. Entre
com o usuário criado no passo 4 e você verá a listagem de clientes (vazia,
até cadastrar algum `client` direto no banco ou pela próxima etapa de UI).

## Testes

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest (regras de negócio / funções puras)
npm run test:e2e   # Playwright (fluxo de login) -- precisa de `.env.local` preenchido
```

## Estrutura

```
app/            Rotas (App Router): /login, /clientes
lib/auth/       Regras de perfil (quem é "perfil interno")
lib/supabase/   Clientes Supabase (browser, server, proxy/middleware)
proxy.ts        Protege rotas: exige sessão logada (Next.js "Proxy", ex-middleware)
supabase/       Migrations SQL
tests/          Testes unitários (Vitest)
e2e/            Testes end-to-end (Playwright)
docs/           Visão, modelo de dados, decisões (ADRs), progresso, backlog
```

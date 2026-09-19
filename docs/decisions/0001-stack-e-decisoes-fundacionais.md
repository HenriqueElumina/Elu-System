# ADR 0001 — Stack tecnológica e decisões fundacionais

**Status:** Aceito — 2026-09-19

## Contexto

A Etapa 0.1 (Onda 0) do Elu System exigia confirmar a stack técnica e resolver
as decisões de negócio listadas na seção 13 do `CLAUDE.md`, antes de qualquer
modelagem de dados ou código de produto.

## Decisão

### Stack técnica

- **Frontend/Backend:** Next.js (App Router) + TypeScript.
- **Banco de dados:** PostgreSQL via Supabase, com Row Level Security (RLS)
  como mecanismo de isolamento por perfil e por cliente — aplicado no banco,
  não só na interface.
- **Auth:** Supabase Auth.
- **UI:** Tailwind CSS + shadcn/ui.
- **Testes:** Vitest para regras de negócio; Playwright para fluxos críticos.
- **Jobs/automação:** Supabase Edge Functions + `pg_cron` para tarefas simples
  (régua de cobrança, alertas). Revisar se a necessidade crescer além disso.
- **Hospedagem:** Vercel (aplicação) + Supabase (banco, auth, storage).

### Quem desenvolve

Sócio (Henrique), com Claude Code como par de programação.

### Financeiro

- **Regime tributário:** Simples Nacional.
- **Município de emissão:** Bragança Paulista/SP.
- **Boleto/Pix:** Efí.
- **NFSe:** provedor final **pendente**. Depende de cobertura municipal e deve
  ser validado com o contador antes da implementação, no início da Onda 1.
  Candidatos considerados: Focus NFe, PlugNotas, eNotas.

### Armazenamento de vídeo (módulo Audiovisual)

Modelo híbrido:

- Vídeos em **revisão ativa** (aguardando aprovação/comentário) ficam em um
  storage com suporte a player e comentário por timecode. Candidato inicial:
  Supabase Storage com player customizado — a confirmar na spec do módulo
  Audiovisual (Onda 2).
- Após aprovação/entrega, os arquivos (brutos e finais) são arquivados no
  **Google Drive**, mantendo o hábito atual da equipe e evitando custo de
  storage de vídeo pesado a longo prazo no Supabase.
- Justificativa: o Google Drive não tem comentário nativo por timecode, então
  usá-lo para a revisão ativa quebraria um requisito central do módulo
  (item 7 do mapa de módulos do `CLAUDE.md`).

### Ferramentas atuais

A agência hoje usa apenas Google Drive (arquivos) e MLabs (agendamento de
conteúdo social). Não há histórico complexo de outras ferramentas para migrar
na Fundação. MLabs é candidato a integração por API ou substituição no módulo
Conteúdo (Onda 2/3) — registrado em `docs/backlog.md`.

## Consequências

- RLS no Postgres passa a ser o mecanismo central de isolamento de dados do
  portal do cliente — precisa de testes específicos por perfil desde a
  Etapa 0.3.
- A escolha do provedor de NFSe fica bloqueada até validação contábil; não
  bloqueia a Onda 0, mas é prioridade no início da Onda 1 (Financeiro).
- O storage híbrido de vídeo adiciona uma decisão técnica extra a resolver na
  spec do módulo Audiovisual (qual player/serviço de revisão usar) — não
  bloqueia a Onda 0.
- MLabs pode gerar necessidade de integração por API no módulo Conteúdo;
  avaliar quando chegarmos lá.

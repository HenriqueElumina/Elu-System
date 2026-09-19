# Progresso — Elu System

## Onda 0 — Planejamento

### Etapa 0.1 — Alinhamento (concluída em 2026-09-19)

- Stack técnica confirmada (ver `docs/decisions/0001-stack-e-decisoes-fundacionais.md`).
- Decisões de negócio resolvidas: quem desenvolve (sócio + Claude Code),
  regime fiscal (Simples Nacional, Bragança Paulista/SP), boleto/Pix (Efí),
  storage de vídeo (híbrido: revisão ativa em player com timecode +
  arquivamento no Google Drive), hospedagem (Vercel + Supabase), ferramentas
  atuais (Google Drive + MLabs, sem migração complexa de dados).
- Pendência registrada: provedor final de NFSe, a validar com contador antes
  da Onda 1 (ver `docs/backlog.md`).

Aprovada em 2026-09-19 pelo dono do produto.

### Etapa 0.2 — Visão e MVP (concluída em 2026-09-19)

- `docs/00-visao.md` criado: mapa de módulos por onda, perfis de acesso e
  recorte do MVP da Onda 1.
- Decisões de recorte confirmadas: assinatura digital já integrada no MVP
  (provedor a decidir — Clicksign vs ZapSign), handoff venda→operação
  automático desde o MVP, DRE/reajuste anual ficam para a Onda 2, proposta
  comercial no MVP é só dados internos (sem PDF formatado ainda).
- Pendências novas registradas em `docs/backlog.md`: escolha entre
  Clicksign/ZapSign.

Aprovada em 2026-09-19 pelo dono do produto.

### Etapa 0.3 — Modelo de dados inicial (concluída em 2026-09-19)

- Schema SQL da Fundação em
  `supabase/migrations/20260919120000_foundation_schema.sql`: `profile`,
  `employee`, `client`, `client_contact`, `service`, `contract`,
  `contract_item`, `project`, `audit_log`. RLS habilitado em todas as
  tabelas.
- ERD e descrição de cada tabela em `docs/01-modelo-de-dados.md`.
- Decisões de modelagem em `docs/decisions/0002-modelagem-fundacao.md`
  (perfil como enum, `employee` separado de `profile`, `contract_item`,
  inclusão do `audit_log`, simplificação de RLS para `colaborador`).
- Migration testada localmente com PostgreSQL 16: aplica limpo, inserts de
  caminho feliz funcionam, constraints rejeitam dado inválido, RLS bloqueia
  sem sessão autenticada, reverte e reaplica sem erro.
- Pendência nova registrada no backlog: ajustar RLS de `client`/`project`
  quando o módulo de Tarefas trouxer alocação em projeto.

Aprovada em 2026-09-19 pelo dono do produto.

### Etapa 0.4 — Scaffold (concluída em 2026-09-19)

- Projeto Next.js 16 (App Router) + TypeScript + Tailwind criado na raiz
  do repositório. Ver decisões técnicas em
  `docs/decisions/0003-scaffold.md`.
- Supabase: cliente browser/server (`lib/supabase/`), `proxy.ts`
  protegendo rotas (exige sessão), login (`/login`) e primeira tela
  funcional protegida por perfil (`/clientes`, lista a tabela `client`).
- Nova migration
  `supabase/migrations/20260919130000_profile_signup_trigger_and_grants.sql`:
  cria `profile` automaticamente no signup + grants explícitos para
  `authenticated` (projeto Supabase criado com exposição automática de
  tabelas desligada).
- Testes: Vitest (7 testes, regra de perfil interno) e Playwright (login
  redireciona quem não está autenticado; credencial inválida mostra erro
  chamando a API real do Supabase). CI no GitHub Actions rodando
  lint/typecheck/testes unitários a cada push.
- Projeto Supabase real criado pelo dono do produto (`elu-system`, região
  São Paulo). `.env.local` configurado com as credenciais.
- Validado localmente: lint, typecheck, testes unitários, build de
  produção e testes e2e todos passando.
- Pendências novas registradas no backlog: aplicar as migrations no
  Supabase real e criar o primeiro usuário (passo a passo no `README.md`,
  ação do dono do produto), shadcn/ui, Playwright no CI, tipos gerados do
  Supabase, fluxo de convite de colaborador.

**Onda 0 (planejamento) concluída e validada em produção em 2026-09-19:**
dono do produto aplicou as duas migrations no Supabase real, criou o
usuário sócio e publicou no Vercel. Login funcionando, perfil `socio`
lido corretamente, tela `/clientes` protegida carregando (vazia, como
esperado — nenhum cliente cadastrado ainda).

Aguardando aprovação explícita do dono do produto para iniciar a **Onda 1
— Fundação e receita**, e definição de qual etapa começa primeiro.

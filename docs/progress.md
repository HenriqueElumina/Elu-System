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

## Onda 1 — Fundação e receita

### Etapa 1.1 — Cadastro de clientes (concluída em 2026-09-20)

- Fluxo de onboarding: sócio/gestor gera um link único (`/clientes` →
  "Gerar link para novo cliente"), cliente preenche em `/convite/[token]`
  (público, sem login) — dados da empresa, endereço, contato principal,
  contato financeiro e baseline de redes sociais (Instagram, Facebook,
  TikTok, YouTube, LinkedIn + outra). Fica como `pending_review` até
  sócio/financeiro/gestor aprovar em `/clientes/[id]`.
- Cadastro manual em `/clientes/novo` (mesmo formulário, sem o link) para
  clientes que a agência já tem hoje — entra direto como `approved`.
- Nova migration
  `supabase/migrations/20260920090000_client_onboarding.sql`: colunas de
  documento/endereço/status em `client`, `is_billing` em `client_contact`,
  tabelas novas `client_social_account` e `client_invite`, funções
  `get_client_invite`/`submit_client_invite` (únicas portas de entrada
  públicas, sem expor tabela nenhuma a `anon`).
- Decisões em `docs/decisions/0004-cadastro-clientes-onboarding.md`.
- Validação de CPF/CNPJ com dígito verificador real
  (`lib/validation/document.ts`) e Zod (`lib/validation/client-intake.ts`)
  na fronteira do formulário, cliente e servidor.
- Testes: Vitest (validadores de documento + schema do formulário, 20
  testes no total no projeto), Playwright (link de convite inválido mostra
  erro sem exigir login), migration testada localmente (fluxo completo do
  convite, RLS, revert e reaplicação).
- Migration aplicada pelo dono do produto no Supabase real e fluxo
  validado em produção: link gerado, formulário preenchido (dados +
  redes sociais), cliente aprovado.

Aprovada e validada em produção em 2026-09-20 pelo dono do produto.

### Etapa 1.2 — Catálogo de serviços e playbooks (concluída em 2026-09-21)

- Telas `/servicos` (lista), `/servicos/novo` e `/servicos/[id]` (editar
  serviço + montar playbook: adicionar/editar/remover/reordenar etapas).
  Só `socio` edita; demais perfis internos veem em modo leitura.
- Correção de bug: RLS de `service` permitia `gestor` escrever, contra o
  que `docs/00-visao.md` definia (catálogo é leitura para gestor). Corrigido
  nesta etapa.
- Nova tabela `playbook_step` (nome, descrição, ordem, SLA em dias) — um
  serviço, uma lista ordenada de etapas, sem tabela `playbook` separada.
- Migration
  `supabase/migrations/20260921090000_service_catalog.sql`: corrige a
  policy `service_write` e cria `playbook_step` com RLS.
- Decisões em `docs/decisions/0005-catalogo-servicos-playbooks.md`.
- Testes: Vitest (validação de serviço/etapa e conversão reais↔centavos,
  26 testes no total), Playwright (`/servicos` exige login), migration
  testada localmente (sócio escreve, gestor só lê, revert/reaplicação).
- Migration aplicada pelo dono do produto no Supabase real e fluxo
  validado em produção (cadastro de serviço + montagem do playbook).

Aprovada e validada em produção em 2026-09-21 pelo dono do produto.

### Etapa 1.3 — Comercial: leads e propostas (concluída em 2026-09-22)

- Telas `/leads` (funil por estágio), `/leads/novo`, `/leads/[id]`
  (editar lead, mudar estágio com motivo de perda, lista de propostas) e
  `/leads/[id]/propostas/novo` + `/propostas/[id]` (montar/editar
  proposta escolhendo serviços do catálogo, preço editável, total
  calculado, mudar status da proposta).
- Só `socio`/`gestor` criam/editam; `financeiro` só lê (mesmo padrão de
  `contract`).
- Novas tabelas `lead`, `proposal`, `proposal_item`.
- Migration
  `supabase/migrations/20260922090000_comercial_lead_proposta.sql`.
- Decisões em `docs/decisions/0006-comercial-lead-proposta.md`.
- Testes: Vitest (schemas de lead/proposta, 32 testes no total),
  Playwright (`/leads` exige login), migration testada localmente
  (sócio/gestor escrevem, colaborador só lê, revert/reaplicação).
- **Fora do escopo desta etapa** (fica pra Etapa 1.4): contrato,
  assinatura digital, handoff automático (criar cliente/projeto/tarefas a
  partir do playbook, cobrança recorrente).
- Migration aplicada pelo dono do produto no Supabase real e fluxo
  validado em produção (lead criado, proposta montada, estágios
  mudados).

Aprovada e validada em produção em 2026-09-22 pelo dono do produto.

### Etapa 1.4 — Contrato a partir da proposta (concluída em 2026-09-23)

- Provedor de assinatura digital decidido: **ZapSign** (integração de
  verdade é a Etapa 1.5).
- Etapa 1.4 dividida em 3 (1.4 nesta etapa, 1.5 assinatura, 1.6 handoff
  parcial) porque o handoff completo depende dos módulos de Tarefas e
  Financeiro, que ainda não existem.
- Tela do lead ganhou "vincular cliente" (escolher um já cadastrado ou
  cadastrar um novo, que volta linkado automaticamente).
- Na proposta aceita, botão "Gerar contrato" (pede data de início/fim,
  copia os itens da proposta — preço e tipo de cobrança do catálogo).
  Impede gerar dois contratos da mesma proposta.
- Telas `/contratos` (lista) e `/contratos/[id]` (detalhe, com status
  editável manualmente por enquanto).
- Migration
  `supabase/migrations/20260923090000_contrato_a_partir_da_proposta.sql`:
  `contract.proposal_id` (rastreabilidade, único por proposta).
- Decisões em `docs/decisions/0007-contrato-a-partir-da-proposta.md`.
- Testes: Vitest (schema de datas do contrato, 36 testes no total),
  Playwright (`/contratos` exige login), migration testada localmente
  (fluxo completo, bloqueio de contrato duplicado, revert/reaplicação).
- Migration aplicada pelo dono do produto no Supabase real e fluxo
  validado em produção (cliente vinculado ao lead, contrato gerado a
  partir de proposta aceita).

Aprovada e validada em produção em 2026-09-23 pelo dono do produto.

### Etapa 1.5 — Assinatura digital com ZapSign (concluída e validada em produção — sandbox — em 2026-09-24)

- Dono do produto forneceu o modelo de contrato real da Elumina (usado só
  na conversa, sem dados de cliente indo pro repositório). Regras
  confirmadas: vigência = data do contrato; pagamento recorrente mensal
  único (1ª parcela 1 mês após a data do contrato); multa/reajuste fixos;
  "inclusos" vem da descrição do serviço no catálogo; "não inclusos" é
  lista fixa, com checklist na hora do envio pra assinatura marcando o
  que já está incluso nesse contrato específico.
- PDF gerado em código (`@react-pdf/renderer`, `lib/pdf/`) — texto
  jurídico fornecido pelo dono do produto, só genericizado + campos
  dinâmicos.
- Integração com a API do ZapSign (`lib/zapsign/`): criar documento,
  consultar status. Botão "Enviar para assinatura" no contrato, com opção
  de reenviar (cria novo documento no ZapSign) enquanto não assinado.
- Webhook em `/api/webhooks/zapsign/[secret]`: segredo compartilhado vai
  na própria URL (a tela de cadastro de webhook do ZapSign não tem campo
  de cabeçalho customizado), comparado com `timingSafeEqual`. Reconsulta
  o documento na API (o evento dispara por signatário, não só quando
  todos assinaram) e atualiza o contrato via função `SECURITY DEFINER`
  (mesmo padrão da Etapa 1.1 — sem `service_role` key).
- Botão "Baixar PDF assinado" quando o contrato está assinado — busca um
  link novo no ZapSign a cada clique (o link que a API devolve expira em
  60min, não dá pra guardar).
- Primeira vez que `audit_log` (criada na Etapa 0.3) é efetivamente usada:
  grava um registro a cada atualização de status de assinatura.
- Migration
  `supabase/migrations/20260924090000_assinatura_digital_zapsign.sql`.
- Decisões em `docs/decisions/0008-assinatura-digital-zapsign.md`
  (inclui os bugs achados e corrigidos no teste real, abaixo).
- Testes: Vitest (49 testes no total — inclui geração de PDF válido e
  autenticação do webhook), migration testada localmente (RLS, função,
  auditoria, revert/reaplicação).
- **Teste de ponta a ponta feito em produção, ambiente sandbox do ZapSign**
  (dono do produto como signatário dos dois lados) — três bugs achados e
  corrigidos ao longo do teste, todos só visíveis contra a API real:
  1. `send_automatic_email` precisa vir dentro de cada signatário, não no
     nível do documento — sem isso o ZapSign não mandava e-mail nenhum.
  2. O middleware de sessão (`proxy.ts`) barrava a própria rota do
     webhook — sem usuário logado, redirecionava a chamada do ZapSign pra
     `/login`, que devolve 405 pra POST. `/api` foi excluído do
     middleware (rotas de API cuidam da própria autenticação).
  3. A tela de cadastro de webhook do ZapSign não tem campo de cabeçalho
     customizado — o segredo foi movido pra própria URL.
- **Pendência para quando for usar com cliente real:** trocar
  `ZAPSIGN_API_TOKEN`/`ZAPSIGN_API_BASE_URL` no Vercel de volta pra
  produção (hoje configurado pra sandbox, sem validade jurídica) e
  recadastrar o webhook na conta de produção do ZapSign — registrado no
  backlog.

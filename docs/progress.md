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

Aprovada e validada em produção (ambiente sandbox) em 2026-09-24 pelo
dono do produto.

### Etapa 1.6 — Handoff parcial: criar projeto ao assinar (concluída em 2026-09-25)

- Trigger no banco (`handle_contract_signed`, `AFTER UPDATE ON contract`):
  sempre que o contrato vira `status = 'signed'` — pelo webhook do
  ZapSign ou por troca manual de status — cria uma linha em `project`
  (tabela existente desde a Fundação, nunca usada até agora). Um só
  projeto por contrato (`unique (contract_id)`), nome = nome do cliente,
  data de início = data do contrato, auditoria com o ator quando aplicável.
- Tela nova `/projetos`: lista (nome, cliente, status, início), cada
  linha leva pra página do cliente — sem tela de projeto dedicada ainda
  (fica pra quando o módulo de Tarefas, Onda 2, existir de verdade).
  Link "Projeto criado" na página do contrato quando já existe.
- Migration
  `supabase/migrations/20260925090000_handoff_parcial_projeto.sql`.
- Decisões em `docs/decisions/0009-handoff-parcial-projeto.md`.
- Testes: migration testada localmente (contrato manual e via função do
  webhook criam o projeto certo, idempotência contra duplicata, revert
  limpo); Playwright (`/projetos` exige login); `npm run lint`,
  `typecheck`, `test` (49 testes) e `build` sem erro.
- **Fora do escopo** (fica pro backlog/Onda 2): handoff completo (tarefas
  do playbook, cobrança recorrente), tela de edição de projeto, tela de
  projeto dedicada.
- Migration aplicada pelo dono do produto no Supabase real e fluxo
  validado em produção (contrato assinado gerou o projeto sozinho,
  visível em `/projetos`).

Aprovada e validada em produção em 2026-09-25 pelo dono do produto.

## Onda 1 — Financeiro

### Etapa 1.7 — Contas a receber, cobrança recorrente (código pronto em 2026-09-26, aguardando aplicar migration + configurar Cron na Vercel)

- Contrato passa a exigir data de fim (antes opcional) — necessário pra
  calcular quantas parcelas o contrato tem. Contratos antigos sem
  `end_date` continuam existindo assim, só aparecem como "sem prazo
  definido" nas contas a receber.
- Nova tabela `invoice` (1 por contrato/mês). Trigger da Etapa 1.6
  estendida (`handle_contract_signed`) agenda o primeiro vencimento ao
  assinar; função `generate_due_invoices()` (chamada por um Cron Job
  diário da Vercel) gera as faturas vencidas — cobre vários meses de
  atraso numa chamada só, sem duplicar.
- Tela `/financeiro`: uma linha por contrato (cliente, parcela, parcelas
  pagas/total, valor total, remanescente). Seção "Faturas" dentro de
  `/contratos/[id]` com cada parcela e botão "Marcar como paga"
  (`socio`/`financeiro`).
- Migration
  `supabase/migrations/20260926090000_financeiro_contas_a_receber.sql` —
  **já aplicada em produção pelo dono do produto** (confirmado: `CRON_SECRET`
  configurado na Vercel, tela `/financeiro` no ar mostrando o estado
  vazio corretamente).
- **Correção (mesmo dia, revisando o PDF gerado):** a cláusula de
  vigência sempre mostrava "por prazo indeterminado" mesmo com data de
  fim definida (bug — `endDate: null` fixo no código desde a Etapa 1.5);
  e a regra de vencimento estava errada (não é "1 mês depois, mesmo dia"
  — é dia 1–15 vence dia 10 do mês seguinte, dia 16–31 vence dia 25).
  Corrigido em `lib/validation/contract.ts` (`addOneMonth` virou
  `computeFirstDueDate`), `app/contratos/actions.ts`, e nova migration
  `supabase/migrations/20260926150000_corrige_vencimento_cobranca.sql`
  (troca a função `handle_contract_signed` — nenhuma fatura tinha sido
  gerada ainda com a regra antiga, sem dado pra migrar). Ver ADRs 0008 e
  0010.
- Decisões em `docs/decisions/0010-financeiro-contas-a-receber.md`
  (inclui uma correção no próprio processo de teste local — testar RLS
  como superusuário mascarava bugs de permissão).
- Testes: migration testada localmente (geração de fatura com catch-up de
  meses atrasados, idempotência, cálculo de total/remanescente, regra de
  vencimento nos casos de fronteira, RLS por perfil com troca de role de
  verdade, revert limpo); Vitest (`computeReceivableSummary` e
  `computeFirstDueDate`, 54 testes no total); Playwright (`/financeiro`
  exige login); `npm run lint`, `typecheck` e `build` sem erro.
- **Fora do escopo:** boleto/Pix de verdade (Etapa 1.8), NFSe (pendente
  do contador), contas a pagar/fluxo de caixa (Etapa 1.9).
- Migration de correção
  (`20260926150000_corrige_vencimento_cobranca.sql`) aplicada pelo dono
  do produto no Supabase real e fluxo validado em produção: PDF de
  contrato de teste com vigência certa, fatura gerada com o vencimento
  certo (dia 10 ou 25, conforme a regra), visível em `/financeiro`.

Aprovada e validada em produção em 2026-09-26 pelo dono do produto.

### Etapa 1.8 — Boleto via Efí (concluída e validada em produção — homologação — em 2026-09-27)

- Escopo confirmado com o dono do produto: só boleto nesta etapa (Pix
  fica pra depois). Credenciais de homologação e certificado (`.p12`)
  já fornecidos e testados localmente (formato válido, sem senha);
  chaves de produção guardadas à parte, aguardando a troca no futuro.
- `lib/efi/client.ts`: autenticação OAuth2 + certificado mTLS (via
  `node:https`, não `fetch` — precisa de controle direto do agente TLS),
  criar boleto (`/v1/charge/one-step`), consultar cobrança, resolver
  notificação de webhook.
- `invoice` ganha `external_charge_id`/`boleto_barcode`. Botões "Gerar
  boleto"/"Ver boleto" na seção "Faturas" do contrato.
- Webhook `/api/webhooks/efi/[secret]` (mesmo padrão do ZapSign — segredo
  na URL, não a assinatura nativa da Efí, que não confirmei direito) —
  resolve o token de notificação, reconsulta cada cobrança na API antes
  de confiar no status, atualiza a fatura via
  `update_invoice_payment_status` (`SECURITY DEFINER`).
- Migrations `supabase/migrations/20260927090000_boleto_efi.sql` e
  `20260927120000_boleto_url_armazenada.sql` (correção — guardar o link
  do boleto na criação, ver abaixo).
- Pequeno refactor: `isAuthorizedWebhook` (segredo de webhook na URL)
  virou compartilhado (`lib/webhooks/shared-secret.ts`) entre ZapSign e
  Efí, em vez de duplicado.
- **Teste de ponta a ponta em produção, ambiente de homologação da Efí**
  (dono do produto, credenciais e certificado próprios) — 4 bugs achados
  e corrigidos ao longo do teste, todos só visíveis contra a API real:
  1. Telefone precisa vir só com dígitos, sem código de país — corrigido
     com `sanitizePhoneNumber` na fronteira com a Efí.
  2. `juridical_person` (cliente CNPJ) fica dentro de `customer`, não ao
     lado — a Efí respondia "Propriedade desconhecida".
  3. A resposta de criação da cobrança vem embrulhada
     (`{"code", "data": {...}}`), não crua — `charge_id` vinha
     `undefined`. `unwrapChargeResponse` aceita os dois formatos.
  4. Consequência do bug 3: precisou limpar manualmente o
     `external_charge_id` corrompido de uma fatura de teste. Aproveitado
     pra simplificar "Ver boleto": o link agora é guardado na criação
     (nova coluna `boleto_url`), sem depender do formato da resposta de
     "detalhar cobrança" (que não bateu com o da criação).
- Decisões e os 4 bugs documentados em
  `docs/decisions/0011-boleto-efi.md`.
- Testes: migration testada localmente (mapeamento defensivo de status,
  auditoria, contexto anon, revert limpo); Vitest
  (`sanitizePhoneNumber`, `unwrapChargeResponse`, `extractNotificationToken`,
  65 testes no total); `npm run lint`, `typecheck` e `build` sem erro.
- **Fora do escopo:** Pix, juros/multa por atraso automáticos, cancelar
  boleto quando a fatura é cancelada, cliente pessoa física (CPF, não
  testado — risco conhecido: pode faltar data de nascimento no cadastro).
- **Ainda não testado:** confirmação de pagamento via webhook (a Efí não
  tem simulação de boleto avulso self-service em homologação — só pra
  assinatura; teste real fica pra quando um boleto de verdade for pago,
  ou se o dono do produto abrir chamado com o suporte deles).

### Etapa 1.9 — Contas a pagar e fluxo de caixa (concluída em 2026-09-28)

- Nova tabela `payable`: lançamento manual (descrição, valor,
  vencimento, status), sem automação — diferente do `invoice`, não tem
  contrato gerando sozinho.
- Tela `/financeiro/contas-a-pagar`: lista + "Lançar conta" +
  "Marcar como paga" (`socio`/`financeiro`).
- Tela `/financeiro/fluxo-de-caixa`: resumo do mês (entrada − saída =
  saldo) + lista de lançamentos pagos no período (faturas pagas +
  contas a pagar pagas), com seletor de mês.
- Migration
  `supabase/migrations/20260928090000_contas_a_pagar_fluxo_caixa.sql`.
- Decisões em `docs/decisions/0012-contas-a-pagar-fluxo-caixa.md`.
- Testes: migration testada localmente (RLS por perfil com `SET ROLE
  authenticated` de verdade, revert limpo); Vitest
  (`computeCashFlowSummary`, `monthRange`, 71 testes no total);
  Playwright (`/financeiro/contas-a-pagar` e `/financeiro/fluxo-de-caixa`
  exigem login); `npm run lint`, `typecheck` e `build` sem erro.
- **Fora do escopo:** conciliação via OFX, categorias de despesa,
  reajuste, DRE, contas a pagar recorrentes automáticas.
- Com esta etapa, o recorte do MVP do módulo Financeiro está completo,
  exceto NFSe (pendente do contador).
- Migration aplicada no Supabase real e validada em produção pelo dono
  do produto em 2026-09-30.

### Etapa 1.10 — Conta bancária, baixa vinculada e reversão de pagamento (código pronto em 2026-09-29)

- Nova tabela `bank_account` (nome/apelido, banco, agência, número da
  conta, `active`), mesmo padrão de acesso do `invoice`/`payable`.
  `invoice` e `payable` ganham `bank_account_id`.
- "Marcar como paga" (fatura e conta a pagar) deixou de ser um clique só
  — agora é um formulário que exige escolher a conta bancária usada.
  Novo botão "Reverter pagamento" nas faturas/contas já pagas (com
  confirmação), pra corrigir uma baixa errada — volta pro status
  pendente, limpa `paid_at` e `bank_account_id`.
- Baixa e reversão passam por funções SQL (`mark_invoice_paid`,
  `revert_invoice_payment`, `mark_payable_paid`,
  `revert_payable_payment`), `SECURITY INVOKER` (diferente do webhook da
  Efí — aqui sempre tem um usuário autenticado de verdade por trás, então
  a RLS de quem chama já resolve a permissão). Cada uma grava em
  `audit_log` quem fez, quando, com qual conta — fecha (parcialmente) a
  pendência de auditoria que estava no backlog.
- Tela nova `/financeiro/contas-bancarias`: lista + cadastrar conta
  (só `socio`/`financeiro`; sem edição/desativação ainda). Conta bancária
  usada passou a aparecer nas listagens de contas a pagar, faturas do
  contrato e fluxo de caixa.
- Migration
  `supabase/migrations/20260929090000_conta_bancaria_reversao_pagamento.sql`.
- Decisões em
  `docs/decisions/0013-conta-bancaria-reversao-pagamento.md`.
- Testes: migration testada localmente (RLS por perfil com `SET ROLE
  authenticated` de verdade — `financeiro` marca/reverte, `gestor` só lê,
  `colaborador` sem acesso; trava contra marcar pago duas vezes ou
  reverter o que não está pago; `audit_log` grava certo; revert limpo).
  Achado no teste local (não é bug da migration): faltava
  `grant usage on schema auth to authenticated` no stub local do schema
  `auth` — as funções anteriores eram todas `SECURITY DEFINER` e nunca
  precisaram chamar `auth.uid()` como o próprio autenticado; corrigido só
  no ambiente de teste, o Supabase real já tem esse grant de fábrica.
  `CashFlowTransaction` ganhou `bankAccountName` (Vitest ajustado, 71
  testes continuam passando); Playwright novo pra
  `/financeiro/contas-bancarias` e `/nova`; `npm run lint`, `typecheck` e
  `build` sem erro.
- **Fora do escopo:** editar/desativar conta bancária cadastrada errada.
- Migration aplicada no Supabase real e validada em produção pelo dono
  do produto em 2026-09-30.

## Onda 2 — Operação

### Etapa 2.1 — Tarefas nascendo do playbook do projeto (código pronto em 2026-09-30)

- Nova tabela `task` (título/descrição copiados do `playbook_step` no
  momento da criação, status `pending`/`in_progress`/`done`, prazo
  calculado a partir do início do projeto + SLA da etapa do playbook).
- `handle_contract_signed()` (Etapas 1.6/1.7) ganhou um laço a mais, na
  mesma transação que já cria o `project`: gera uma `task` por
  `playbook_step` de cada serviço vendido no contrato.
- `update_task_status(task_id, status)` (`SECURITY DEFINER`, mesmo
  padrão da Etapa 1.10): permite `colaborador` avançar/reabrir status
  mesmo sem `UPDATE` direto liberado na tabela `task` pela RLS.
- Tela nova `/projetos/[id]`: dados do projeto + lista de tarefas com
  botões "Iniciar"/"Concluir"/"Reabrir". Link a partir da lista
  `/projetos`.
- Sem atribuição de responsável, Kanban, registro de tempo ou
  Definition of Done nesta etapa — próximas fatias do módulo de
  Tarefas.
- Migration `supabase/migrations/20260930090000_tarefas_do_playbook.sql`.
- Decisões em `docs/decisions/0014-tarefas-do-playbook.md`.
- Testes: migration testada localmente (assinar contrato gera
  projeto+tarefas com prazo certo; `financeiro` sem acesso; `colaborador`
  lê mas `UPDATE` direto na tabela é bloqueado pela RLS — só
  `update_task_status` funciona; `gestor` também; id inexistente dá erro
  controlado; revert limpo); Playwright novo pra `/projetos/[id]`;
  `npm run lint`, `typecheck` e `build` sem erro.
- **Fora do escopo:** contratos assinados antes desta etapa não ganham
  tarefas retroativamente (decisão do dono do produto: só vale daqui pra
  frente).
- Migration aplicada no Supabase real e validada em produção pelo dono
  do produto em 2026-09-30 (contrato assinado com playbook cadastrado
  gerou projeto com as tarefas certas; status avançado por "Iniciar"/
  "Concluir" na tela `/projetos/[id]`).

### Etapa 2.2 — Responsável, estimativa de horas e histórico de status (código pronto em 2026-10-01)

- `task` ganha `assigned_to` (responsável, opcional) e
  `estimated_hours` (estimativa de horas, opcional — só captura o dado,
  sem cálculo de capacidade ainda).
- `update_task_status()` agora bloqueia `colaborador` em tarefa que não
  é dele (`assigned_to` diferente ou nulo); `socio`/`gestor` continuam
  podendo mexer em qualquer uma. **Efeito colateral esperado e
  confirmado com o dono do produto:** tarefas da Etapa 2.1 (sem
  responsável ainda) ficam bloqueadas pra `colaborador` até alguém
  atribuir.
- Nova tabela `task_status_history` (de/para, quem, quando), gravada
  automaticamente a cada chamada de `update_task_status`; tela mostra
  num `<details>` expansível por tarefa.
- Tela `/projetos/[id]`: cada tarefa mostra responsável, estimativa de
  horas, "atualizado há X" (`formatRelativeTime`,
  `lib/format/relative-time.ts`) e histórico; `socio`/`gestor` reatribuem
  e ajustam estimativa por um formulário inline; botões de status só
  aparecem pra quem pode agir (responsável, ou `socio`/`gestor`).
- Migration
  `supabase/migrations/20261001090000_responsavel_estimativa_historico_tarefa.sql`.
- Decisões em `docs/decisions/0015-responsavel-estimativa-historico-tarefa.md`.
- Testes: migration testada localmente (`colaborador` bloqueado sem
  responsável ou responsável errado, liberado quando é o dele; `gestor`
  sempre passa; histórico grava certo; `financeiro` sem acesso ao
  histórico, `colaborador` com acesso; revert limpo); Vitest
  (`formatRelativeTime`, 77 testes no total); `npm run lint`,
  `typecheck`, `build` e Playwright completo sem erro.
- **Fora do escopo:** responsável só entre `socio`/`gestor`/`colaborador`
  (sem `freelancer` — acesso restrito dele ainda não existe no sistema);
  sem filtro de "minhas tarefas"; sem uso da estimativa em nenhum
  cálculo.
- Migration aplicada no Supabase real e validada em produção pelo dono
  do produto em 2026-10-01.

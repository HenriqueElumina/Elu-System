# Elu System — Sistema interno da Elumina Partners

> Leia este arquivo inteiro no início de cada sessão. Ele define o contexto, as regras de trabalho e o estado do projeto.

## 0. REGRA MAIS IMPORTANTE: trabalhamos passo a passo

Este projeto é grande e será construído **em etapas pequenas, revisadas e aprovadas por mim (o dono do produto)**. Portanto:

1. **Nunca implemente mais de uma etapa por vez.** Não adiante módulos, tabelas ou telas que não foram pedidos na etapa atual.
2. **Antes de escrever código, apresente um plano curto**: o que será feito, quais arquivos serão criados ou alterados, riscos e dúvidas. **Espere meu "ok".**
3. **Se houver ambiguidade de negócio, pergunte.** Não invente regra de negócio, regra fiscal ou fluxo. Faça poucas perguntas, objetivas, com uma sugestão de resposta padrão.
4. **Entregue em fatias pequenas que funcionam de ponta a ponta** (banco → API → tela → teste), em vez de camadas inteiras incompletas.
5. **Ao fim de cada etapa**, entregue: (a) resumo do que foi feito, (b) como testar, (c) o que ficou pendente ou em dúvida, (d) proposta da próxima etapa. Atualize `docs/progress.md`.
6. **Decisões relevantes** (stack, provedor, modelagem, trade-offs) viram um ADR curto em `docs/decisions/NNNN-titulo.md`.
7. **Não adicione dependências, serviços ou ferramentas sem justificar** e sem minha aprovação.
8. **Não altere nada fora do escopo da etapa.** Se notar algo que deveria mudar, registre em `docs/backlog.md` e me avise.
9. Prefira **entregáveis concretos** (specs, schema, código, testes) a recomendações abstratas.

Se eu pedir algo que conflite com estas regras, avise e pergunte como prosseguir.

## 1. Contexto do negócio

**Elumina Partners** é uma agência com três linhas de serviço:

- **Mídias sociais:** gestão de conteúdo, calendário editorial, aprovação, métricas.
- **Audiovisual:** produção de vídeo e foto (roteiro, captação, edição, revisão, entrega).
- **Consultoria e operação de marketplace:** diagnóstico, catálogo de SKUs, anúncios, ads, rotina operacional (Mercado Livre, Amazon, Shopee, Magalu, TikTok Shop etc.).

**Tamanho atual:** 2 sócios e 5 colaboradores. Meta: **10 colaboradores até o fim do ano.** Por isso o sistema precisa **forçar processo** e tirar conhecimento da cabeça das pessoas.

**Idioma:** interface e documentação em **português (pt-BR)**. Código, nomes de tabelas e variáveis em **inglês**. Moeda **BRL**, fuso **America/Sao_Paulo** (armazenar em UTC).

## 2. Objetivo do sistema

Centralizar a operação da agência. O sistema deve responder, sem ninguém caçar dados, a três perguntas:

1. **Quanto lucro cada cliente e cada serviço dão?**
2. **Quem está sobrecarregado e quando precisamos contratar?**
3. **Quais clientes estão em risco?**

## 3. Escopo funcional (mapa de módulos)

| # | Módulo | Resumo |
|---|---|---|
| 1 | **Fundação** | Auth, perfis e permissões, cadastros (clientes, colaboradores, serviços), auditoria |
| 2 | **Catálogo de serviços e playbooks** | Cada serviço tem etapas, checklists, SLAs e templates de tarefa; a venda gera o projeto pronto |
| 3 | **Comercial** | Pipeline, leads, propostas geradas do catálogo, contratos com assinatura digital |
| 4 | **Financeiro** | Contas a receber (recorrência), boleto/Pix, NFSe, régua de cobrança, contas a pagar, fluxo de caixa, DRE por cliente/serviço, reajuste anual, conciliação |
| 5 | **Tarefas e projetos** | Kanban/lista/calendário, templates do playbook, registro de tempo, SLA, Definition of Done |
| 6 | **Conteúdo (social)** | Pipeline de conteúdo, calendário editorial, brand kit, aprovação no portal, métricas |
| 7 | **Audiovisual** | Pipeline de produção, agenda de captações, equipamentos, revisão com comentário no timecode, freelancers |
| 8 | **Marketplace** | Diagnóstico com score, catálogo de SKUs, integrações por API, alertas, calendário de campanhas, calculadora de margem, fee variável |
| 9 | **Colaboradores (RH)** | Cadastro, custo/hora, ausências, onboarding/offboarding, metas, 1:1, plano de carreira, recrutamento |
| 10 | **Capacidade e rentabilidade** | Horas planejadas vs. disponíveis; margem por cliente/serviço; gatilho de contratação |
| 11 | **Portal do cliente** | Aprovações, relatórios, financeiro, solicitações, NPS, linha do tempo do mês |
| 12 | **Sucesso do cliente (CS)** | Health score, risco de churn, renovações, cross-sell |
| 13 | **Aprendizado** | Base de conhecimento (SOPs), trilhas, onboarding, quizzes |
| 14 | **Marketing da agência** | Landing pages com UTM, funil e CAC, portfólio, indicação |
| 15 | **Painel dos sócios** | MRR, caixa, inadimplência, margem, pipeline, ocupação, NPS, concentração de receita |
| 16 | **Transversais** | Cofre de credenciais, automações/notificações (e-mail, WhatsApp), IA aplicada (por último) |

## 4. Ordem de construção (ondas)

- **Onda 0 — Planejamento (sem código de produto):** confirmar stack, mapa de módulos, perfis, MVP, modelo de dados inicial.
- **Onda 1 — Fundação e receita:** cadastros, catálogo de serviços, comercial, contratos, financeiro com boleto e NFSe.
- **Onda 2 — Operação:** tarefas com playbooks, aprovação de conteúdo e vídeo, registro de tempo, capacidade, colaboradores. *Antecipar cedo:* playbooks, onboarding de colaboradores e base de conhecimento simples (por causa das contratações).
- **Onda 3 — Cliente e retenção:** portal completo, CS, relatórios automáticos, integrações de marketplace e redes sociais.
- **Onda 4 — Escala:** aprendizado avançado, marketing da agência, IA, painel avançado.

**Só avance de onda com minha aprovação explícita.** Dentro de cada onda, as etapas serão definidas juntas.

## 5. Perfis de acesso

`socio` (admin total) · `financeiro` · `gestor` · `colaborador` · `freelancer` (acesso restrito a jobs atribuídos) · `cliente` (só vê os próprios dados no portal).

Princípio: **menor privilégio**. Dados financeiros, custo/hora e credenciais só para perfis autorizados. O portal do cliente **nunca** pode expor dados de outro cliente (isolamento no nível do banco, não só na interface).

## 6. Stack (PROPOSTA — a confirmar na Etapa 0.1)

Sugestão inicial, sujeita a mudança conforme quem for construir e manter:

- **Frontend/Backend:** Next.js (App Router) + TypeScript
- **Banco:** PostgreSQL (Supabase), com Row Level Security
- **Auth:** Supabase Auth
- **Armazenamento de arquivos:** Supabase Storage (vídeos pesados: avaliar serviço dedicado depois)
- **UI:** Tailwind + biblioteca de componentes (shadcn/ui)
- **Jobs/automação:** a definir (cron, filas)
- **Testes:** Vitest/Jest para regras de negócio; Playwright para fluxos críticos

> Não trate a stack como definitiva até eu confirmar.

## 7. Integrações (a decidir)

Sempre atrás de uma **camada de adaptação (interface própria)**, para poder trocar de provedor sem reescrever o sistema.

- **Boleto/Pix:** candidatos Asaas, Efí, Iugu
- **NFSe:** candidatos Focus NFe, PlugNotas, eNotas (depende do município e do regime tributário)
- **Assinatura digital:** Clicksign ou ZapSign
- **WhatsApp:** API oficial (via provedor)
- **Redes sociais e marketplaces:** APIs oficiais de cada plataforma (na Onda 3)
- **Contabilidade/folha:** apenas exportação ou integração; o sistema não calcula folha

Regras: webhooks **idempotentes**, com verificação de assinatura; falhas com retentativa e log; chaves de API somente em variáveis de ambiente.

## 8. Regras de arquitetura e código

**Dados**
- Valores monetários em **centavos (inteiro)** ou `numeric`, **nunca float**.
- Tabelas com `id` (uuid), `created_at`, `updated_at`; **soft delete** onde houver histórico relevante.
- Toda mudança de schema via **migration versionada**. Nunca alterar o banco "na mão".
- **Log de auditoria** para ações sensíveis (financeiro, contratos, credenciais, permissões).
- Isolamento por perfil aplicado no banco (RLS), não só no frontend.

**Segurança e LGPD**
- Nunca commitar segredos. Usar `.env` e `.env.example` (sem valores reais).
- **Cofre de credenciais:** criptografia real (nunca texto puro), com registro de quem acessou e quando.
- Minimizar dados pessoais; prever exportação e exclusão de dados de titulares.

**Código**
- TypeScript estrito. Validação de entrada com um schema (ex.: Zod) em toda fronteira.
- Regras de negócio em camada própria (fora dos componentes de UI), **com testes**. Testes são obrigatórios para: cálculo financeiro, recorrência de cobrança, reajuste, rentabilidade, permissões.
- Commits pequenos e descritivos, uma etapa por branch/PR.
- Sem código morto, sem comentários óbvios. Comente o **porquê**, não o quê.

**Regra fiscal**
- **Não invente regra tributária.** Onde houver dúvida fiscal (ex.: verba de mídia repassada ao cliente não é faturamento da agência; retenção de impostos na NFSe; regime tributário), sinalize e deixe para validação com o contador.

## 9. Princípios de produto

1. **O sistema força o processo:** cada serviço vira playbook; o projeto nasce pronto quando a venda é fechada.
2. **Handoff automático venda → operação:** ao marcar "ganho": cria cliente, contrato, projeto, tarefas de onboarding, cobrança recorrente e acesso ao portal.
3. **Poucos cliques:** o colaborador registra tempo e status com o mínimo de atrito, senão não vai usar.
4. **Rentabilidade e capacidade são cidadãs de primeira classe**, então desde cedo modelar horas, custo e receita por cliente.
5. **Simples primeiro:** construir a versão mais enxuta que resolve a dor, medir uso, depois evoluir.

## 10. Modelo de dados central (rascunho conceitual)

Entidades-base que os demais módulos usarão. **Só detalhar em schema SQL na Etapa 0.3, com minha revisão.**

`user` · `role/permission` · `client` · `client_contact` · `service` (catálogo) · `playbook` / `playbook_step` · `lead` · `proposal` · `contract` · `project` · `task` · `time_entry` · `employee` · `invoice` · `payment` · `payable` · `audit_log`

## 11. Estrutura de documentação do repositório

```
CLAUDE.md                 (este arquivo)
docs/
  00-visao.md             (mapa de módulos, perfis, MVP)
  01-modelo-de-dados.md   (ERD e decisões de modelagem)
  progress.md             (o que foi feito, o que está em andamento)
  backlog.md              (ideias e pendências fora do escopo atual)
  decisions/              (ADRs: 0001-*.md, 0002-*.md ...)
  specs/                  (uma spec por módulo, escrita antes do código)
```

## 12. Definition of Done (por etapa)

Uma etapa só está pronta quando:
- [ ] Faz exatamente o que a etapa pedia (nem mais, nem menos).
- [ ] Tem testes para as regras de negócio envolvidas.
- [ ] Roda localmente sem erro, com instruções de como rodar/testar.
- [ ] Migrations aplicam e revertem sem problema.
- [ ] Permissões por perfil foram consideradas e testadas.
- [ ] `docs/progress.md` foi atualizado e decisões relevantes viraram ADR.
- [ ] Eu revisei e aprovei.

## 13. Decisões em aberto (perguntar quando relevante)

- Quem vai desenvolver e manter o sistema (sócio, dev do time, equipe externa)?
- Município de emissão e regime tributário da Elumina (define o provedor de NFSe).
- Provedor de boleto/Pix preferido (taxas, conta bancária atual).
- Onde ficarão vídeos pesados (brutos e entregas)?
- Hospedagem e orçamento mensal de infraestrutura.
- Quais ferramentas atuais serão substituídas e quais dados precisam ser migrados (planilhas, Trello, Notion, etc.)?

## 14. ESTADO ATUAL E PRÓXIMO PASSO

**Estamos na Onda 0 (planejamento). Nenhum código de produto deve ser escrito ainda.**

Etapas da Onda 0, uma por vez, cada uma com minha aprovação antes da seguinte:

- **Etapa 0.1 — Alinhamento:** você me faz as perguntas da seção 13 que ainda estiverem abertas e propõe a stack final (com prós e contras curtos). Resultado: ADR 0001 (stack).
- **Etapa 0.2 — Visão e MVP:** escrever `docs/00-visao.md` com mapa de módulos, perfis de acesso e recorte do MVP da Onda 1.
- **Etapa 0.3 — Modelo de dados inicial:** schema SQL e ERD apenas da **fundação** (usuários, perfis, clientes, serviços, contratos, projetos, colaboradores). Sem tabelas dos demais módulos ainda.
- **Etapa 0.4 — Scaffold:** criar o projeto base (auth, perfis, layout, migrations, testes, CI) e uma primeira tela funcional protegida por perfil.

**Comece pela Etapa 0.1. Não avance para a 0.2 até eu aprovar.**

> **Status (2026-09-19):** Onda 0 (planejamento) concluída — Etapas 0.1,
> 0.2, 0.3 e 0.4 feitas. Stack e decisões de negócio em
> `docs/decisions/0001-stack-e-decisoes-fundacionais.md`. Mapa de módulos,
> perfis de acesso e recorte do MVP da Onda 1 em `docs/00-visao.md`. Schema
> SQL da Fundação (com RLS) em
> `supabase/migrations/20260919120000_foundation_schema.sql` e
> `..._profile_signup_trigger_and_grants.sql`, ERD em
> `docs/01-modelo-de-dados.md`, decisões de modelagem em
> `docs/decisions/0002-modelagem-fundacao.md`. Projeto Next.js scaffolded
> (login + tela `/clientes` protegida por perfil), decisões em
> `docs/decisions/0003-scaffold.md`, passo a passo de setup no `README.md`.
> Detalhes e pendências em `docs/progress.md` e `docs/backlog.md`.
> Validado em produção: login, perfil `socio` e a tela `/clientes`
> funcionando (Vercel + Supabase reais).
>
> **Onda 1 — Fundação e receita, em andamento.** Etapa 1.1 (Cadastro de
> clientes) concluída e validada em produção em 2026-09-20 — ver
> `docs/decisions/0004-cadastro-clientes-onboarding.md`. Etapa 1.2
> (Catálogo de serviços e playbooks) concluída e validada em produção em
> 2026-09-21 — ver `docs/decisions/0005-catalogo-servicos-playbooks.md`.
> Etapa 1.3 (Comercial: leads e propostas) concluída e validada em
> produção em 2026-09-22 — ver
> `docs/decisions/0006-comercial-lead-proposta.md`. Provedor de
> assinatura digital decidido: **ZapSign**. Etapa 1.4 (Contrato a partir
> da proposta) concluída e validada em produção em 2026-09-23 — ver
> `docs/decisions/0007-contrato-a-partir-da-proposta.md`. Etapa 1.5
> (Assinatura digital ZapSign) concluída e validada em produção
> (ambiente **sandbox** do ZapSign, sem validade jurídica) em
> 2026-09-24 — teste de ponta a ponta feito pelo dono do produto como
> signatário dos dois lados: PDF gerado, enviado, e-mail recebido,
> assinado, status atualizado sozinho via webhook, PDF assinado baixado
> pela tela. Três bugs só visíveis contra a API real foram achados e
> corrigidos nesse teste — ver
> `docs/decisions/0008-assinatura-digital-zapsign.md`. **Pendência antes
> de usar com cliente de verdade:** trocar as credenciais do ZapSign no
> Vercel de sandbox pra produção e recadastrar o webhook lá (contratar
> plano de API de produção é decisão do dono do produto, registrada no
> backlog). Etapa 1.6 (handoff parcial: criar projeto ao assinar)
> concluída e validada em produção em 2026-09-25 — trigger no banco cria
> `project` sozinho quando o contrato vira assinado (webhook ou manual),
> tela `/projetos` nova (lista, sem edição), link na página do contrato —
> ver `docs/decisions/0009-handoff-parcial-projeto.md`. Handoff completo
> (tarefas do playbook + cobrança recorrente) continua fora de alcance até
> os módulos de Tarefas (Onda 2) e Financeiro (Onda 1) existirem.
>
> **Financeiro (módulo novo da Onda 1), Etapa 1.7 — Contas a receber:**
> concluída e validada em produção em 2026-09-26 — contrato passa a
> exigir data de fim; fatura mensal gerada sozinha (Cron Job diário da
> Vercel + `generate_due_invoices()`, mesmo padrão `SECURITY DEFINER` das
> etapas anteriores); tela `/financeiro` (parcela, total, remanescente
> por contrato) e seção "Faturas" no contrato com "Marcar como paga" —
> ver `docs/decisions/0010-financeiro-contas-a-receber.md`. **Correção no
> mesmo dia** (revisando o PDF gerado): vigência sempre aparecia "por
> prazo indeterminado" mesmo com data de fim definida (bug desde a Etapa
> 1.5), e a regra de vencimento estava errada — corrigida pra: dia 1–15
> do contrato vence dia 10 do mês seguinte, dia 16–31 vence dia 25 — ver
> ADRs 0008 e 0010. Teste de ponta a ponta confirmado pelo dono do
> produto: PDF com vigência certa, fatura com vencimento certo em
> `/financeiro`.
>
> **Etapa 1.8 — Boleto via Efí:** concluída e validada em produção
> (ambiente de homologação da Efí) em 2026-09-27 — só boleto nesta etapa,
> Pix fica pra depois. Autenticação OAuth2 + certificado mTLS
> (`lib/efi/client.ts`), botão "Gerar boleto" → "Ver boleto" na fatura,
> webhook `/api/webhooks/efi/[secret]` (segredo na URL, mesmo padrão do
> ZapSign). Teste de ponta a ponta do dono do produto (credenciais e
> certificado próprios) achou e corrigiu 4 bugs só visíveis contra a API
> real — formato do telefone, aninhamento de `juridical_person`, resposta
> embrulhada em `{code, data}`, e por consequência o link do boleto
> passou a ser guardado na criação em vez de buscado de novo — ver
> `docs/decisions/0011-boleto-efi.md`. **Ainda não testado:** confirmação
> de pagamento via webhook (a Efí não tem simulação de boleto avulso
> self-service em homologação — só pra assinatura; fica pendente até um
> boleto real ser pago ou abrir chamado com o suporte deles), cliente
> pessoa física (CPF — risco conhecido: pode faltar data de nascimento no
> cadastro).
>
> **Etapa 1.9 — Contas a pagar e fluxo de caixa:** código pronto em
> 2026-09-28 — nova tabela `payable` (lançamento manual, sem automação);
> tela `/financeiro/contas-a-pagar` (lista + lançar + marcar como paga);
> tela `/financeiro/fluxo-de-caixa` (resumo do mês + lista de
> lançamentos, com seletor de mês) — ver
> `docs/decisions/0012-contas-a-pagar-fluxo-caixa.md`. Com isso, o
> recorte do MVP do módulo Financeiro está completo, exceto NFSe
> (pendente de confirmação com o contador — bloqueante desde a Etapa
> 0.1). Migration aplicada e validada em produção em 2026-09-30.
>
> **Etapa 1.10 — Conta bancária, baixa vinculada e reversão de
> pagamento:** concluída e validada em produção em 2026-09-30 — nova
> tabela `bank_account` (nome, banco, agência, número da conta);
> `invoice`/`payable` ganham `bank_account_id`; "Marcar como paga" virou
> formulário que exige escolher a conta bancária; novo botão "Reverter
> pagamento" nas faturas/contas já pagas; tela
> `/financeiro/contas-bancarias` (lista + cadastrar). Baixa/reversão
> gravam em `audit_log` (quem, quando, qual conta) — ver
> `docs/decisions/0013-conta-bancaria-reversao-pagamento.md`.
>
> **NFSe (único item restante do MVP do Financeiro) adiado a pedido do
> dono do produto em 2026-09-30** — precisa pensar melhor, não é
> urgente agora. Retomar quando ele trouxer o assunto de volta (ver
> `docs/backlog.md`). Com isso, o resto do MVP do módulo Financeiro
> (Onda 1) está completo e validado em produção.
>
> **Onda 2 — Operação, iniciada em 2026-09-30 com aprovação explícita
> do dono do produto.** Etapa 2.1 (Tarefas nascendo do playbook do
> projeto): código pronto em 2026-09-30 — nova tabela `task`;
> `handle_contract_signed()` gera uma tarefa por etapa do playbook de
> cada serviço vendido, na mesma transação que já cria o `project`
> (Etapa 1.6); `update_task_status()` deixa `colaborador` avançar/reabrir
> status sem escrita direta na tabela; tela nova `/projetos/[id]` (dados
> do projeto + lista de tarefas) — ver
> `docs/decisions/0014-tarefas-do-playbook.md`. Sem atribuição de
> responsável, Kanban ou registro de tempo ainda (próximas fatias).
> Contratos assinados antes desta etapa não ganham tarefas
> retroativamente (decisão do dono do produto). Migration aplicada e
> validada em produção em 2026-09-30.
>
> **Etapa 2.2 — Responsável, estimativa de horas e histórico de
> status:** código pronto em 2026-10-01 — `task` ganha `assigned_to` e
> `estimated_hours`; `update_task_status()` passa a bloquear
> `colaborador` fora da própria tarefa atribuída (`socio`/`gestor`
> continuam livres); nova tabela `task_status_history` (histórico
> expansível na tela); `/projetos/[id]` ganha reatribuição de
> responsável, estimativa de horas e "atualizado há X" — ver
> `docs/decisions/0015-responsavel-estimativa-historico-tarefa.md`.
> **Efeito colateral esperado e confirmado com o dono do produto:**
> tarefas da Etapa 2.1 (sem responsável) ficam bloqueadas pra
> `colaborador` até alguém atribuir. Migration aplicada e validada em
> produção em 2026-10-01.
>
> **Etapa 2.3 — Registro de tempo:** código pronto em 2026-10-02 — nova
> tabela `time_entry` (lançamento manual: data, horas, nota; sem timer
> ao vivo); mesma regra de permissão da Etapa 2.2 (só responsável ou
> `socio`/`gestor` lançam, sempre em nome de si mesmo); corrigir = apagar
> (soft-delete, só `socio`/`gestor`) e lançar de novo, sem edição em
> linha; `/projetos/[id]` mostra "lançado Xh" ao lado da estimativa — ver
> `docs/decisions/0016-registro-de-tempo.md`. Sem uso do dado em nenhum
> cálculo de capacidade/rentabilidade ainda (módulo 10, mais adiante).
> Migration aplicada e validada em produção em 2026-10-03.
>
> **Etapa 2.4 — Criar, editar e duplicar tarefa:** concluída em
> 2026-10-02, **sem migration** (a RLS de `task` da Etapa 2.1 já cobria
> `socio`/`gestor` inserindo/editando tarefas). Botões "+ Nova tarefa",
> "Editar" e "Duplicar" em `/projetos/[id]`; duplicar copia dados mas
> reseta status e responsável; lista ordena por prazo (mais próximo
> primeiro, sem prazo no fim) em vez de por criação — ver
> `docs/decisions/0017-criar-e-duplicar-tarefa.md`. Validado em
> produção em 2026-10-03.
>
> **Módulo 9 (Colaboradores/RH), Etapa 9.1 — Convite e cadastro básico
> de colaborador:** código pronto em 2026-10-03 — colaborador ganha
> login de verdade pelo próprio `auth.signUp` (sem `service_role`),
> e-mail travado do convite; novas tabelas `employee_invite` e
> `employee_compensation` (custo/hora separado de `employee`, RLS só
> `socio`/`financeiro`); telas `/colaboradores`,
> `/colaboradores/convidar`, `/convite-colaborador/[token]` — ver
> `docs/decisions/0018-convite-e-cadastro-colaborador.md`.
> **Correção de segurança no caminho:** `handle_new_user()` (Etapa 0.4)
> confiava no `role` vindo do próprio cadastro — travado pra sempre
> nascer `colaborador`, já que esta etapa expõe o primeiro auto-cadastro
> público do app. **Correção no mesmo dia:** `signUp()` não passava
> `emailRedirectTo` — link de confirmação usava a Site URL do painel do
> Supabase (ainda em `localhost:3000`); corrigido pra usar sempre a
> origem de onde a pessoa acessa. **Pendência:** aplicar a migration no
> Supabase real, ajustar Site URL/Redirect URLs no painel do Supabase
> pro domínio de produção, e validar o convite ponta a ponta com e-mail
> de verdade.
>
> **Redefinir senha** (pedido do dono do produto, sem migration):
> `/login` ganha "Esqueci minha senha"; nova página pública
> `/redefinir-senha` usa o mesmo padrão de troca de código (PKCE) do
> convite. Middleware precisou liberar a rota como pública.
> **Correção no mesmo dia:** o link de recuperação de senha não chega
> com `?code=` (só o de confirmação de cadastro chega) — trocado pra
> escutar o evento oficial `PASSWORD_RECOVERY`. **Confirmado funcionando
> em produção pelo dono do produto.**
>
> **Etapa 9.2 — Ficha de onboarding do colaborador:** código pronto em
> 2026-10-04 — o mesmo formulário de `/convite-colaborador/[token]` que
> cria a conta (Etapa 9.1) agora também coleta contato de emergência,
> saúde básica, objetivos de carreira e dados pessoais (nascimento, CPF,
> endereço) — um passo só, obrigatório, mas cada campo individual é
> opcional. Nova tabela `employee_onboarding` (RLS: `socio`/`financeiro`
> ou o próprio colaborador); `submit_employee_invite` passou de 2 pra 16
> parâmetros — ver
> `docs/decisions/0019-ficha-onboarding-colaborador.md`. **Pendência:**
> aplicar a migration no Supabase real e validar o fluxo completo em
> produção.
>
> **Etapa 9.3 — Editar e desativar colaborador:** código pronto em
> 2026-10-05 — "excluir" virou "desativar" (apagar de verdade exigiria
> `service_role`, nunca usada neste projeto); `auth_role()` passa a
> exigir `profile.active = true`, o que bloqueia automaticamente **todo
> o sistema** pra um perfil desativado (não só RH) com uma mudança só;
> `/colaboradores` ganha "Editar" (cargo — `socio`; custo/hora —
> `socio`/`financeiro`) e "Desativar"/"Reativar" (`socio`, sócio não
> desativa a si mesmo); middleware desloga perfil desativado com aviso
> — ver `docs/decisions/0020-editar-e-desativar-colaborador.md`.
> **Pendência:** aplicar a migration no Supabase real e validar em
> produção.
>
> **Decisão do dono do produto:** trocar o ZapSign de sandbox pra
> produção fica pra só no final do projeto base (não antes) — sem data
> definida.
>
> **Etapa UX.1 — Identidade visual e navegação responsiva:** código
> pronto em 2026-09-24 — sem migration, só frontend. Cores (carvão
> `#20232a`, bege `#e6ddcc`) e fonte Poppins aplicadas a partir do logo e
> das fontes oficiais (NOAH + Poppins) enviados pelo dono do produto —
> NOAH fica pendente por ser fonte comercial sem arquivo disponível
> ainda. Sidebar fixa no desktop / gaveta no mobile
> (`components/app-shell.tsx`, `lib/nav/links.ts`), aplicada nas ~23
> telas internas autenticadas, substituindo o cabeçalho manual de cada
> uma sem mudar tabelas, formulários ou regras de negócio — ver
> `docs/decisions/0021-identidade-visual-navegacao.md`. **Pendência:**
> dono do produto validar visualmente em produção (não foi possível
> autenticar contra o Supabase real nesta sessão). **Mesmo dia:** fundo
> bege atrás do conteúdo em todas as telas, com cartão branco por cima
> (mudança só no `AppShell`, sem tocar em nenhuma tela); linhas finas
> separando visualmente os módulos da sidebar (sem nome de categoria,
> só separação visual) — ver atualizações no mesmo ADR
> (`docs/decisions/0021-identidade-visual-navegacao.md`). Formato visual
> aprovado pelo dono do produto a partir dos screenshots enviados na
> sessão.
>
> **Etapa Leads.1 — Excluir, arquivar e filtro por data:** código pronto
> em 2026-09-24 — `lead` ganha `archived_at` (arquivar não mexe no
> `status`, dá pra desarquivar; separado de excluir); `deleted_at`
> (existia desde a Etapa 1.3) ganha ação de verdade pela primeira vez.
> `/leads`: filtro "cadastrados nos últimos 30/60/90 dias", data de
> cadastro em cada card, botões Arquivar/Excluir (`socio`/`gestor`),
> link "Ver arquivados" com Desarquivar/Excluir — ver
> `docs/decisions/0022-excluir-arquivar-filtro-leads.md`. **Pendência:**
> aplicar a migration no Supabase real e validar em produção.
>
> **Etapa Contratos.1 — Agrupar por estágio:** código pronto em
> 2026-09-24 — sem migration. `/contratos` mostra 4 seções empilhadas
> (Aguardando elaboração = Rascunho; Pendente de assinatura = Enviado;
> Vigente = Assinado + Ativo; Arquivados = Cancelado + Encerrado, por
> enquanto usando só o status) — ver
> `docs/decisions/0023-agrupar-contratos-por-estagio.md`. Primeira de
> duas etapas (dono do produto pediu pra dividir).
>
> **Etapa Contratos.2 — Excluir arquivados e trocar status na lista:**
> código pronto em 2026-09-24 — sem migration (confirmado com o dono do
> produto que o campo `archived_at` cogitado na ADR 0023 não é
> necessário; "Arquivados" continua = Cancelado/Encerrado por status).
> Botão "Excluir" (soft delete, só na seção Arquivados) e seletor de
> status compacto em cada linha de `/contratos` (dá pra trocar o
> estágio sem abrir o contrato) — ver
> `docs/decisions/0024-excluir-arquivados-status-inline-contratos.md`.
>
> **Financeiro como categoria com subcategorias na sidebar:** código
> pronto em 2026-09-24 — a partir de um print de referência (ERP da
> Olist), "Financeiro" na sidebar passa a expandir 4 subitens (Contas a
> receber, Contas a pagar, Fluxo de caixa, Contas bancárias) quando você
> está em alguma tela do módulo; `NavLink` ganha `children` opcional.
> Removidos os links repetidos que cada tela do Financeiro tinha no
> topo (redundantes com o menu novo) — ver
> `docs/decisions/0025-financeiro-categoria-subcategoria.md`.
>
> **Projetos agrupados (Onboarding/Vigente/Arquivados) e excluir:**
> código pronto em 2026-09-24 — mesmo padrão de Contratos, mapeando os
> 4 status que `project` já tinha sem uso (Onboarding = Planejamento,
> Vigente = Ativo, Arquivados = Concluído + Cancelado, com "Excluir").
> Diferente de Contratos, não existia nenhum jeito de mudar o status de
> um projeto — essa etapa criou `updateProjectStatus` do zero, além do
> seletor de status compacto em cada linha de `/projetos` — ver
> `docs/decisions/0026-projetos-onboarding-vigente-arquivados.md`.
>
> **Etapa Workflow.1 — Quadro de demandas de conteúdo:** código pronto
> em 2026-09-24 — pedido do dono do produto (print de referência da
> mLabs), cobre "aprovação de conteúdo e vídeo" já previsto pro escopo
> da Onda 2 (não é avanço de onda). Nova tabela `content_demand`
> (título, cliente, responsável, canais, data prevista, briefing, link
> de mídia, tags), separada do sistema de tarefas existente. Funil
> simplificado (5 estágios: Rascunho → Em produção → Aguardando
> aprovação → Aprovado/Agendado → Concluído — não os 8 da referência).
> Tela `/projetos/workflow` (Kanban) + `/projetos/workflow/novo`;
> "Projetos" vira categoria com "Workflow" ao lado. "Aprovado/Agendado"
> por enquanto é sócio/gestor confirmando com o cliente por fora do
> sistema — ver `docs/decisions/0027-workflow-demandas-conteudo.md`.
> **Migration aplicada e validada em produção em 2026-09-24.**
> **Correção no mesmo dia:** o card do quadro não mostrava
> `briefing`/link de mídia/tags (dono do produto não conseguia abrir o
> link do Drive de uma demanda real) — nova tela
> `/projetos/workflow/[id]` (só leitura, mostra tudo) + título do card
> virou link, mesmo padrão das outras listas. Sem migration.
>
> **Atualização no mesmo dia — cores por estágio no Workflow:** código
> pronto em 2026-09-24 — pedido do dono do produto, cores discretas e
> próximas da marca por estágio (cinza-ardósia, dourado queimado,
> azul-acinzentado, verde-oliva, carvão da marca no estágio final),
> como acento (barra no topo da coluna, ponto ao lado do nome, borda
> esquerda no card) — nunca preenchendo o card inteiro. Cores
> centralizadas em `CONTENT_DEMAND_STATUS_ACCENTS`
> (`lib/validation/content-demand.ts`), reaproveitadas em
> `/projetos/workflow` e `/projetos/workflow/[id]`. **Bug achado e
> corrigido na verificação visual:** `tailwind.config.ts` não varria
> `lib/**`, então o Tailwind purgava as classes novas; corrigido
> adicionando `lib/**` ao `content`. Sem migration — ver atualização no
> mesmo ADR (`docs/decisions/0027-workflow-demandas-conteudo.md`).
>
> **Etapa Workflow.3 — Visualização em lista e filtros:** código pronto
> em 2026-09-24 — pedido do dono do produto (print de referência do
> mLabs). `/projetos/workflow` ganha alternância Painel | Lista
> (`?view=lista`) e filtros por Situação (multi-seleção), Cliente,
> Responsável e Período (atalhos Hoje/Esta semana/Este mês +
> personalizado) — tudo em query string, sem JS de cliente, mesmo
> padrão do filtro de dias dos Leads. Lista = mesmos 5 estágios
> empilhados, ordenados por data prevista de publicação (sem data no
> fim; sempre aparece mesmo com período filtrado). Lógica extraída e
> testada em `lib/workflow/period-filter.ts`. Sem migration — ver
> `docs/decisions/0028-workflow-lista-filtros.md`.
> **Próxima etapa (Workflow.2):** login de cliente de verdade (não
> existe hoje) pra aprovar demandas direto pelo sistema.

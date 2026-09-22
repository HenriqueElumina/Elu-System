# Backlog

- **NFSe:** validar com o contador o provedor final (Focus NFe / PlugNotas /
  eNotas) considerando Simples Nacional + Bragança Paulista/SP. Bloqueante
  para o módulo Financeiro na Onda 1. **Decisão do dono do produto
  (2026-09-30): adiado de propósito** — precisa pensar melhor antes de
  decidir, e não é urgente agora. Retomar quando ele trouxer o assunto de
  volta; até lá, o resto do MVP do Financeiro (contas a receber, boleto,
  contas a pagar, fluxo de caixa, conta bancária) já está completo e
  validado em produção.
- **Audiovisual — player de revisão:** decidir e testar a solução de player
  com comentário por timecode para vídeos em revisão ativa (spec do módulo,
  Onda 2).
- **MLabs:** avaliar se o módulo Conteúdo (social) vai integrar via API com o
  MLabs ou substituí-lo, quando chegarmos na Onda 2/3.
- **Assinatura digital — ZapSign, trocar sandbox por produção:** o teste de
  ponta a ponta (Etapa 1.5) foi feito no ambiente sandbox do ZapSign (sem
  validade jurídica). Antes de usar com cliente real: trocar
  `ZAPSIGN_API_TOKEN`/`ZAPSIGN_API_BASE_URL` no Vercel pro valor de
  produção que já foi configurado antes, contratar o plano de API de
  produção do ZapSign (exige pagamento), e recadastrar o webhook na conta
  de produção (o cadastro de sandbox não vale lá). **Decisão do dono do
  produto (2026-09-26): só fazer essa troca no final do projeto base**,
  não antes — sem data definida.
- **ZapSign — link de download expira:** `original_file`/`signed_file` que
  a API devolve expiram em 60min, por isso não são guardados no banco — o
  botão "Baixar PDF assinado" busca um link novo a cada clique. Se um dia
  precisarmos de um link permanente (ex.: portal do cliente, Onda 3), aí
  sim vale considerar baixar o PDF assinado pra um storage nosso.
- **RLS de `client`/`project` para `colaborador`:** hoje o colaborador lê
  todos os clientes e projetos; quando o módulo de Tarefas (Onda 2) trouxer
  alocação em projeto, ajustar as policies para filtrar só o que ele está
  alocado.
- **shadcn/ui:** rodar o CLI (`npx shadcn@latest init`) e trocar os
  componentes escritos à mão (formulário de login, tabela de clientes) por
  componentes do shadcn/ui, conforme a ADR 0001. Ver ADR 0003.
- **Playwright no CI:** adicionar `npm run test:e2e` ao
  `.github/workflows/ci.yml` depois de configurar
  `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` como secrets
  do GitHub Actions.
- **Tipos gerados do Supabase:** rodar `supabase gen types typescript`
  (precisa do Supabase CLI logado no projeto) e tipar os clientes
  `createClient()` com o schema real, em vez de tipagem solta.
- **Convite de colaborador:** hoje só dá para criar usuário direto no
  painel do Supabase. Um fluxo de convite (via API admin do Supabase)
  fica para o módulo de RH (Onda 2).
- **Envio automático do link de convite:** hoje sócio/gestor copia e manda
  por fora (e-mail/WhatsApp manual). Quando o módulo Comercial existir,
  gerar e enviar o link vira parte do handoff automático venda→operação.
- **Série histórica de redes sociais:** `client_social_account` hoje só
  guarda o baseline do fechamento. Novas medições ao longo do tempo e
  gráfico de evolução são do módulo de Conteúdo (Onda 2).
- **UF como lista fixa:** o campo Estado do endereço é texto livre (2
  letras) — trocar por um select com as 27 UFs quando ajustarmos o design
  do formulário (shadcn/ui).
- **Máscara de CEP/telefone/CNPJ-CPF:** os campos aceitam texto livre,
  validado só no formato/dígito verificador. Adicionar máscara de digitação
  é melhoria de UX, não bloqueia o uso.
- **Sub-checklist por etapa do playbook:** hoje cada `playbook_step` é um
  item só (nome/descrição/SLA). Se precisarmos de múltiplos itens de
  checklist dentro de uma etapa, é uma tabela nova. Ver ADR 0005.
- **Handoff automático completo:** a Etapa 1.6 já cria o `project`
  sozinho ao assinar o contrato (ADR 0009); falta tarefas de onboarding a
  partir do playbook e cobrança recorrente automática, que dependem dos
  módulos de Tarefas (Onda 2) e Financeiro (Onda 1, ainda não
  construído). Ver ADR 0007.
- **Tela de projeto:** desde a Etapa 2.1 existe `/projetos/[id]` com a
  lista de tarefas do projeto. Ainda falta: Kanban visual/drag-and-drop,
  edição manual dos dados do projeto (nome, status, datas) — hoje só
  nasce automático e não tem tela de editar.
- **Criação manual de contrato:** hoje só dá pra gerar contrato a partir
  de uma proposta aceita. Um fluxo de contrato manual (sem proposta) fica
  de fora por enquanto — ninguém pediu ainda.
- **Auditoria de troca manual de status do contrato:** `updateContractStatus`
  (Etapa 1.4) ainda não grava em `audit_log`; só a atualização via webhook
  do ZapSign (Etapa 1.5) e, desde a Etapa 1.10, marcar/reverter pagamento
  de fatura e conta a pagar gravam. Padronizar quando fizer sentido.
- **Conta bancária — sem edição/desativação:** a Etapa 1.10 criou a
  tabela `bank_account` com campo `active`, mas só a tela de cadastro
  existe (lista + criar). Editar dado errado ou desativar uma conta
  antiga fica pra quando isso incomodar no uso real.
- **Contas a pagar — conciliação bancária via OFX:** dono do produto
  confirmou (durante o planejamento da Etapa 1.9) que lançamento manual
  serve por enquanto, mas a conciliação de verdade precisa ser feita
  importando extrato em **OFX**. Considerar isso no desenho da Etapa 1.9
  (contas a pagar + fluxo de caixa), mesmo que a importação de OFX em si
  fique pra depois (conciliação bancária automática já era fora do MVP
  da Onda 1, `docs/00-visao.md`).
- **Cancelar faturas pendentes quando o contrato é cancelado:** hoje
  cancelar um contrato só para a geração de *novas* faturas (o cron
  ignora contratos fora de `signed`/`active`); faturas `pending` já
  geradas continuam penduradas. Ver ADR 0010.
- **RLS local: nunca testar como superusuário do Postgres:** durante a
  Etapa 1.7, testar como `postgres` mascarou um bug real de permissão
  (faltava `grant ... to authenticated` em `invoice`) porque superusuário
  ignora RLS por padrão. Retomar a metodologia de teste local (`SET ROLE
  authenticated` de verdade) já usada a partir dessa etapa nas próximas,
  e reconferir com atenção redobrada as etapas anteriores que só testaram
  RLS "por leitura de código" em vez de execução de verdade.
- **Regra de vencimento duplicada em TS e SQL:** `computeFirstDueDate`
  (`lib/validation/contract.ts`, usada na cláusula do PDF) e
  `handle_contract_signed` (SQL, usada pro `next_invoice_due_date` de
  verdade) implementam a mesma regra (dia 10/25) em dois lugares
  independentes. Se um dia essa regra mudar de novo, as duas cópias
  precisam ser atualizadas juntas — considerar unificar (ex.: o app
  consultar o banco em vez de recalcular) se isso já tiver dado problema
  na prática. Ver ADR 0010.
- **Efí — Pix, juros/multa por atraso, cancelar boleto:** a Etapa 1.8 só
  cobre boleto simples. Pix (se fizer sentido no futuro), configuração
  de juros/multa por atraso na cobrança, e cancelar o boleto na Efí
  quando a fatura é cancelada manualmente ficam de fora. Ver ADR 0011.
- **Efí — cliente pessoa física pode exigir data de nascimento:** o
  `client` não guarda data de nascimento; se a Efí exigir esse campo
  (`birth`) pra pagador CPF, gerar boleto pra esses clientes vai falhar
  até o cadastro ganhar esse campo. Só vamos saber com um teste real.
  Ver ADR 0011.
- **Efí — assinatura nativa do webhook (X-Hub-Signature) não
  implementada:** o webhook da Etapa 1.8 usa segredo próprio na URL
  (mesmo padrão do ZapSign), não o esquema de assinatura HMAC nativo da
  Efí — não consegui confirmar com certeza de onde vem a chave desse
  HMAC. Segurança real hoje vem de sempre reconsultar a cobrança na API
  antes de confiar no webhook. Ver ADR 0011.
- **Efí — webhook de confirmação de pagamento ainda não testado contra a
  API real:** só a criação do boleto foi validada. A Efí não tem
  simulação de boleto avulso self-service em homologação (só pra
  assinatura) — testar de verdade só quando um boleto real for pago, ou
  abrindo chamado com o suporte deles passando o `charge_id`. Ver ADR
  0011.
- **Tarefas — responsável só entre perfis internos:** desde a Etapa 2.2,
  só `socio`/`gestor`/`colaborador` podem ser atribuídos a uma tarefa.
  `freelancer` (acesso restrito a jobs atribuídos, `CLAUDE.md` seção 5)
  ainda não tem esse modelo de acesso restrito desenhado no sistema —
  fica pra quando isso existir. Sem filtro de "minhas tarefas" (uma
  lista só com o que é meu, em vez de olhar projeto por projeto) e sem
  Kanban visual ainda. Ver ADR 0015.
- **Tarefas — sem Definition of Done nem alerta de SLA atrasado:** hoje
  o status é só pending/in_progress/done da tarefa inteira, sem
  checklist interno; prazo (`due_date`) existe mas nada avisa quando
  passou. Alerta de atraso é rentabilidade/capacidade (módulo 10). Ver
  ADR 0014.
- **Tarefas — estimativa de horas sem uso ainda:** `estimated_hours`
  (Etapa 2.2) é só captura de dado — não alimenta nenhum cálculo de
  capacidade/rentabilidade (módulo 10) nem registro de tempo de verdade
  (`time_entry`, que ainda não existe). Ver ADR 0015.
- **Tarefas — reatribuição/estimativa não ficam no histórico:**
  `task_status_history` (Etapa 2.2) só grava mudança de *status*, não
  troca de responsável nem de estimativa. Ver ADR 0015.
- **Registro de tempo — sem edição em linha:** desde a Etapa 2.3,
  corrigir um lançamento errado é apagar (soft-delete, só
  `socio`/`gestor`) e lançar de novo — sem editar o valor direto. Se
  isso incomodar no uso real, é candidato a próxima fatia. Ver ADR 0016.
- **Registro de tempo — sem uso em capacidade/rentabilidade ainda:**
  `time_entry` (Etapa 2.3) só mostra a soma ao lado da estimativa da
  tarefa; nenhum cálculo de capacidade, custo/hora ou margem usa esse
  dado ainda — isso é módulo 10. Ver ADR 0016.
- **Registro de tempo — sem timer ao vivo:** a Etapa 2.3 implementou só
  lançamento manual (data + horas + nota). Cronômetro
  iniciar/pausar, se um dia fizer sentido, é uma fatia à parte (mais
  complexa: timer esquecido rodando, sessão entre dispositivos). Ver
  ADR 0016.
- **Colaboradores — editar/desativar sem auditoria:** a Etapa 9.3
  (editar cargo/custo-hora, desativar/reativar) não grava em
  `audit_log` quem fez o quê — mesmo padrão de outras ações
  administrativas que ainda não auditam (`updateContractStatus`, por
  exemplo). Ver ADR 0020.
- **Colaboradores — desativar não apaga o login técnico:** a Etapa 9.3
  bloqueia todo acesso de um perfil desativado (via `auth_role()`), mas
  a conta em si continua existindo no Supabase Auth — não é exclusão de
  dados pessoais (LGPD). Se um dia pedirem isso, é etapa própria. Ver
  ADR 0020.
- **Colaboradores — trava de "não desativar a si mesmo" só no app:** a
  Etapa 9.3 impede um sócio de desativar a própria conta pela tela, mas
  não há trava no banco (RLS) contra isso — alguém mexendo direto no
  SQL Editor do Supabase ainda consegue. Ver ADR 0020.
- **Colaboradores — sem reenviar convite expirado/perdido:** se o link
  expirar (7 dias) ou a pessoa perder o e-mail, o jeito hoje é gerar um
  convite novo do zero. Ver ADR 0018.
- **Colaboradores — só `socio`/`financeiro` convidam:** `gestor` só
  enxerga a lista (sem custo), não convida — decisão da Etapa 9.1 porque
  o formulário de convite já inclui custo/hora. Rever se isso atrapalhar
  o uso real (ex.: gestor de time querendo convidar sem depender de
  sócio/financeiro). Ver ADR 0018.
- **Colaboradores — risco de `profile` órfão sem `employee`:** o fluxo de
  convite chama `auth.signUp` e `submit_employee_invite` em duas
  chamadas separadas (não há transação única entre o Supabase Auth e o
  Postgres). Se a segunda falhar depois da primeira ter funcionado
  (caso raro — ex.: convite expira nos segundos entre uma chamada e
  outra), sobra um `profile` sem `employee` correspondente, exigindo
  conserto manual. Ver ADR 0018.
- **Colaboradores — ficha de onboarding sem tela de consulta:** desde a
  Etapa 9.2, `socio`/`financeiro` conseguem ler `employee_onboarding`
  (RLS já permite), mas não tem tela nenhuma mostrando isso ainda — só
  existe no banco. Ver ADR 0019.
- **Colaboradores — ficha não preenchida retroativamente:** quem foi
  convidado na Etapa 9.1 (antes da 9.2 existir) não tem
  `employee_onboarding`. Ninguém pediu preenchimento retroativo. Ver
  ADR 0019.
- **Colaboradores — sem máscara de CPF/CEP/telefone na ficha de
  onboarding:** mesma simplificação já registrada pro cadastro de
  cliente — campos de texto livre, validados só no formato/dígito
  verificador (CPF). Ver ADR 0019.
- **Tarefas — contratos assinados antes da Etapa 2.1 não têm tarefas:**
  a geração automática só vale pra contratos assinados a partir de
  2026-09-30 (transição de status é o gatilho). Projetos mais antigos
  ficam sem tarefas a menos que alguém gere manualmente. Ver ADR 0014.

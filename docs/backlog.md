# Backlog

- **NFSe:** validar com o contador o provedor final (Focus NFe / PlugNotas /
  eNotas) considerando Simples Nacional + Bragança Paulista/SP. Bloqueante
  para o módulo Financeiro na Onda 1.
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
  produção do ZapSign (exige pagamento — decisão do dono do produto,
  hoje ainda sandbox), e recadastrar o webhook na conta de produção (o
  cadastro de sandbox não vale lá).
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
- **Tela de projeto dedicada e edição:** hoje `/projetos` é só lista
  (leitura) e o projeto nasce automático sem tela de criação/edição
  manual. Uma página de projeto de verdade (Kanban, tarefas, prazos)
  fica pro módulo de Tarefas (Onda 2) — ver ADR 0009.
- **Criação manual de contrato:** hoje só dá pra gerar contrato a partir
  de uma proposta aceita. Um fluxo de contrato manual (sem proposta) fica
  de fora por enquanto — ninguém pediu ainda.
- **Auditoria de troca manual de status do contrato:** `updateContractStatus`
  (Etapa 1.4) ainda não grava em `audit_log`; só a atualização via webhook
  do ZapSign (Etapa 1.5) grava. Padronizar quando fizer sentido.

# Backlog

- **NFSe:** validar com o contador o provedor final (Focus NFe / PlugNotas /
  eNotas) considerando Simples Nacional + Bragança Paulista/SP. Bloqueante
  para o módulo Financeiro na Onda 1.
- **Audiovisual — player de revisão:** decidir e testar a solução de player
  com comentário por timecode para vídeos em revisão ativa (spec do módulo,
  Onda 2).
- **MLabs:** avaliar se o módulo Conteúdo (social) vai integrar via API com o
  MLabs ou substituí-lo, quando chegarmos na Onda 2/3.
- **Assinatura digital:** decidir entre Clicksign e ZapSign ao construir o
  módulo Comercial (Onda 1). O MVP já prevê assinatura digital integrada
  (decisão da Etapa 0.2), falta escolher o provedor.
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

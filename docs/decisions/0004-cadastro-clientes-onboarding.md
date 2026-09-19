# ADR 0004 — Cadastro de clientes via link público de onboarding

**Status:** Aceito — 2026-09-20

## Contexto

Primeira etapa da Onda 1 (Fundação e receita): um processo padronizado
para cada cliente novo, pós-fechamento de contrato — o próprio cliente
preenche seus dados completos (empresa, endereço, contatos, redes
sociais) através de um link único, sem precisar de login. Um sócio ou
gestor revisa antes de virar cadastro oficial. Decisões de escopo detalhadas
na conversa com o dono do produto (link único sem login; revisão antes de
aprovar; geração manual do link até existir o módulo Comercial; inclusão
de contato financeiro e baseline de redes sociais; sem coleta de senha/
acesso de redes sociais nem briefing criativo nesta etapa).

## Decisões

### Acesso público via funções `SECURITY DEFINER`, não service role key

Em vez de dar ao app uma rota de servidor com a `service_role` key do
Supabase (que ignora toda RLS), o acesso público passa por duas funções de
banco (`get_client_invite`, `submit_client_invite`), no mesmo padrão já
usado no `handle_new_user` (ADR 0003). Cada função valida o token por
conta própria antes de fazer qualquer leitura/escrita. Nenhuma tabela
(`client`, `client_contact`, `client_social_account`, `client_invite`) tem
grant para o papel `anon` — só as duas funções. Isso mantém a
regra "isolamento aplicado no banco" (CLAUDE.md, seção 8) mesmo no único
fluxo que precisa funcionar sem login, e evita colocar a `service_role`
key em qualquer lugar do código da aplicação.

### `client_invite`: link com token, validade de 7 dias, uso único

Token aleatório (`gen_random_uuid()`), status `pending`/`submitted`.
`get_client_invite` diferencia 3 motivos de link inválido (não encontrado,
já respondido, expirado) para mostrar mensagem específica ao cliente. Só
`socio`/`gestor` podem gerar convites (RLS de `client_invite`) —
`financeiro` fica de fora porque gerar convite é ação comercial, não
financeira.

### `onboarding_status` em `client`: `invited` → `pending_review` → `approved`

Cliente criado pelo formulário público nasce como `pending_review`.
Cadastro manual (tela `/clientes/novo`, para clientes que a agência já tem
hoje) nasce direto como `approved`. `socio`, `gestor` e `financeiro` podem
aprovar (mesmos perfis que já escrevem em `client`).

### Contato financeiro reaproveitando `client_contact`

Em vez de uma tabela nova, `client_contact` ganhou a coluna `is_billing`.
Quando é a mesma pessoa do contato principal, uma única linha tem as duas
flags; quando é diferente, vira uma segunda linha. Motivo do pedido do
dono do produto: preparar o terreno pra automatizar NFSe/cobrança no
módulo Financeiro, sem inventar regra fiscal agora (só guarda pra quem
mandar o boleto/nota).

### `client_social_account`: baseline agora, série histórica depois

Tabela separada (não colunas soltas em `client`) com `platform`, `handle`,
`followers_count`, `captured_at`. Só grava o que o cliente de fato
preencheu (linha por rede, não uma linha vazia por rede não respondida).
Serve de ponto de partida para medir crescimento; **novas medições ao
longo do tempo (série histórica, gráfico de evolução) são do módulo de
Conteúdo, Onda 2** — não construído agora.

### Validação de CPF/CNPJ com dígito verificador de verdade

`lib/validation/document.ts` implementa o algoritmo público de validação
(não é regra de negócio da Elumina, é validação de formato). Zod
(`lib/validation/client-intake.ts`) valida tudo na fronteira, client-side
e de novo no server action do cadastro manual — RPC pública faz apenas
validação estrutural básica (o document é `unique` no banco; documento
duplicado vira mensagem amigável tratando o erro `23505`).

### `react-hook-form` + `@hookform/resolvers`

Dependência nova, justificada pelo tamanho do formulário (endereço, dois
contatos, 6 redes sociais) — evita reimplementar validação e mensagens de
erro campo a campo na mão. Usa o suporte do RHF a "tipo de entrada" vs
"tipo de saída" do Zod (`useForm<Input, unknown, Output>`), necessário
porque `followersCount` é coagido de string pra number pelo Zod.

## Consequências

- Formulário deliberadamente **não inclui**: acesso/senha de redes
  sociais e contas de anúncio (fica para o módulo de Cofre de
  Credenciais), briefing criativo (módulo de Conteúdo/Audiovisual, Onda
  2), inscrição estadual/municipal (módulo Financeiro/NFSe).
- Envio do link ainda é manual (sócio/gestor copia e manda por fora) até o
  módulo Comercial existir e automatizar esse passo dentro do fechamento
  de venda.
- Testado localmente (PostgreSQL 16, simulando `auth` do Supabase):
  aplicar as 3 migrations em sequência, fluxo completo do convite (válido,
  inexistente, expirado, já respondido), RLS de `client_invite` bloqueando
  `colaborador`, revert e reaplicação da migration nova, todos OK.

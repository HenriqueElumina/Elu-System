# ADR 0008 — Assinatura digital com ZapSign

**Status:** Aceito e validado em produção (ambiente sandbox do ZapSign) — 2026-09-24

## Contexto

Etapa 1.5 da Onda 1: enviar o contrato gerado (Etapa 1.4) para assinatura
digital via ZapSign, e receber a confirmação de assinatura por webhook. O
dono do produto forneceu um contrato real já assinado (cliente Baazar
Decor) como modelo — usado só nesta conversa para extrair a estrutura;
nenhum dado desse cliente específico foi commitado no repositório.

## Decisões

### Geração de PDF em código, com o texto jurídico fornecido pelo dono do produto

O PDF é montado com `@react-pdf/renderer` (roda em Node, sem precisar de
navegador headless — mais simples no Vercel que Puppeteer). Todo o texto
das cláusulas em `lib/pdf/contract-document.tsx` veio do modelo real que
a Elumina já usa — eu não escrevi nenhuma cláusula nova, só genericizei
(tirei os dados do cliente Baazar Decor) e ajustei a cláusula de
pagamento conforme as regras que o dono do produto confirmou (abaixo).

### Regra de pagamento e vigência confirmada com o dono do produto

- **Vigência = data do contrato.** A data que aparece no rodapé do PDF
  ("Bragança Paulista-SP, [data]") é a mesma data de início da vigência
  — não a data em que alguém clica em "Enviar para assinatura" depois.
- **Pagamento recorrente mensal único** (sem mais o parcelamento em 2x
  do modelo original). Primeiro vencimento = 1 mês após a data do
  contrato (`lib/validation/contract.ts`, `addOneMonth`); os seguintes
  vencem todo mês nessa mesma data.
- **Multa de rescisão (40%) e reajuste anual (IPCA)** ficam fixos no
  texto do contrato, iguais em todo contrato.
- **"Não inclusos no projeto"**: lista fixa de 4 itens padrão
  (`STANDARD_EXTRAS`), mas quem gera o envio pra assinatura marca quais
  já estão dentro do escopo deste contrato específico — esses saem da
  lista no PDF. Guardado em `contract.included_extras`.
- **"Inclusos no projeto"**: vem da `description` de cada serviço
  vendido no contrato (campo que já existe no catálogo desde a Etapa
  1.2) — sem campo de texto livre por contrato.

### Detalhes técnicos do ZapSign confirmados via busca (fetch direto bloqueado)

O acesso direto a `docs.zapsign.com.br` está bloqueado pela política de
rede desta sessão; os detalhes abaixo vieram de busca (`WebSearch`), não
de leitura direta da documentação — vale conferir na conta real do
ZapSign se algo não bater:

- Criar documento: `POST https://api.zapsign.com.br/api/v1/docs/`,
  `Authorization: Bearer <token>`, corpo `{ name, base64_pdf, signers }`.
- Consultar documento: `GET /api/v1/docs/{token}/` → `status`
  (`"pending"`, `"signed"`, ...).
- Webhook: sem HMAC. Tentei usar um cabeçalho customizado (`X-Elu-Webhook-Secret`),
  mas a tela de "Criar webhook" do ZapSign (conferida com o dono do
  produto em 24/09/2026) só tem "Tipo de evento" e "URL do webhook" — sem
  campo de cabeçalho. Ajustei para o segredo ir **na própria URL**
  (`/api/webhooks/zapsign/[secret]`), comparado com `timingSafeEqual` no
  nosso endpoint — mesmo nível de proteção, só muda onde o valor viaja.
- O evento `doc_signed` dispara **por signatário**, não só quando todos
  assinaram — por isso o webhook sempre reconsulta `GET /docs/{token}/`
  pra saber o status real do documento, em vez de confiar no corpo do
  webhook.

### Webhook sem sessão: função `SECURITY DEFINER`, mesmo padrão da Etapa 1.1

O webhook do ZapSign chega sem usuário logado no Supabase. Em vez de
usar a `service_role` key (que ignoraria toda RLS), criei
`update_contract_signature_status`, uma função de banco que só localiza
o contrato pelo `external_signature_id` e atualiza status/`signed_at`
— chamada via `anon`, sem expor a tabela `contract` diretamente. Mesmo
padrão do `get_client_invite`/`submit_client_invite` (ADR 0004).

### Auditoria: primeiro uso de verdade da `audit_log`

A função grava uma entrada em `audit_log` a cada atualização de status
de assinatura — primeira vez que essa tabela (criada na Etapa 0.3, mas
nunca populada) é efetivamente usada. Ações manuais de troca de status
de contrato (`updateContractStatus`, Etapa 1.4) ainda não geram log —
registrado em `docs/backlog.md`.

## Validação

- Migration testada localmente: sócio/gestor com sessão normal não
  conseguem chamar a função como se fossem o webhook; `anon` não lê
  `contract`/`audit_log` diretamente; a função atualiza o contrato e
  grava o log; token desconhecido dá erro; revert e reaplicação, limpos.
- PDF de exemplo gerado e conferido visualmente (mandado pro dono do
  produto antes de integrar de verdade) — 4 páginas, todas as cláusulas,
  campos dinâmicos corretos, item marcado como "já incluso" some da
  lista de não inclusos.
- `npm run lint`, `typecheck`, `test` (49 testes) e `build` sem erro.
- **Teste de ponta a ponta em produção, ambiente sandbox do ZapSign**
  (gratuito, sem validade jurídica): contrato gerado, enviado, e-mail
  recebido, ambos os signatários assinaram, status atualizou sozinho no
  sistema via webhook, PDF assinado baixado pela tela. Ver os 3 bugs
  achados e corrigidos abaixo.

## Bugs achados no teste real (não visíveis testando local/offline)

Confirma o aviso que eu já tinha deixado registrado: os detalhes da API
do ZapSign vieram de busca, não da documentação oficial lida direto
(bloqueada nesta sessão) — três coisas não bateram:

1. **`send_automatic_email` é campo de cada signatário, não do
   documento.** Minha primeira tentativa colocou no nível raiz do corpo
   da requisição (`POST /api/v1/docs/`); o ZapSign aceitou sem erro, mas
   não mandou e-mail nenhum. Corrigido movendo o campo pra dentro de cada
   objeto em `signers`.
2. **O middleware de sessão (`proxy.ts`) barrava a própria rota do
   webhook.** Ele exigia usuário logado em toda rota, inclusive
   `/api/webhooks/...`; sem sessão, redirecionava a chamada do ZapSign
   pra `/login`, que não aceita POST — resultado: 405 no histórico de
   webhooks do ZapSign (visível lá, não nos nossos logs). Corrigido
   excluindo `/api` do matcher do middleware — rotas de API cuidam da
   própria autenticação (aqui, o segredo na URL).
3. **A tela real de "Criar webhook" do ZapSign não tem campo de
   cabeçalho customizado** (só "Tipo de evento" e "URL do webhook") —
   diferente do que a busca sugeria. Corrigido antes do teste, movendo o
   segredo pra própria URL (`/api/webhooks/zapsign/[secret]`).

## Consequências

- Testado só contra o **ambiente sandbox** do ZapSign (sem validade
  jurídica) — trocar pra produção fica pro backlog, quando o dono do
  produto decidir contratar o plano de API de produção.
- Os links de PDF que a API devolve (`original_file`/`signed_file`)
  expiram em 60min — por isso não são guardados no banco; o botão
  "Baixar PDF assinado" busca um link novo a cada clique.
- Detalhes da API do ZapSign vieram de busca, não da documentação
  oficial lida diretamente — já rendeu os 3 bugs acima; se aparecer mais
  alguma coisa esquisita, é o primeiro lugar a suspeitar.

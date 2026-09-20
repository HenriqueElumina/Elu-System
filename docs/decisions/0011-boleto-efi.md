# ADR 0011 — Financeiro: boleto via Efí

**Status:** Aceito e validado em produção (ambiente de homologação da Efí) — 2026-09-27

## Contexto

Etapa 1.8 da Onda 1: anexar um boleto de verdade a cada fatura já gerada
pela Etapa 1.7. Escopo confirmado com o dono do produto: **só boleto**
nesta etapa (Pix fica pra depois, se fizer sentido). Provedor decidido
desde a Etapa 0.1: **Efí**.

## Decisões

### Autenticação: OAuth2 + certificado mTLS, via `node:https`

Diferente do ZapSign (token simples), a Efí exige um certificado
apresentado em toda chamada — inclusive a de obter o token de acesso
(`POST /v1/authorize`, HTTP Basic com `client_id`/`client_secret`).
`lib/efi/client.ts` usa `node:https` em vez de `fetch`: dá controle
direto sobre o agente TLS (`pfx` + `passphrase` opcional), o que o
`fetch` do Next.js não expõe de forma simples. O certificado (`.p12`)
fica em `EFI_CERTIFICATE_BASE64` (o arquivo inteiro, em base64, pra caber
numa variável de ambiente) — mesmo truque já usado pro PDF de contrato
(Etapa 1.5), mas agora pra binário em vez de texto gerado.

### Ambiente: homologação por padrão

`EFI_SANDBOX` só vira produção com `"false"` explícito — mesmo cuidado
"padrão seguro" que já vínhamos aplicando desde o ZapSign. O dono do
produto mandou credenciais de produção direto; combinamos usar
homologação pra validar tudo primeiro (mesmo aprendizado da Etapa 1.5:
3 bugs só apareceram testando contra a API real) — as chaves de produção
ficaram guardadas à parte (`EFI_CLIENT_ID_PROD`/`EFI_CLIENT_SECRET_PROD`
no `.env.local`, não commitadas) pra quando for a hora de trocar.

### Webhook: segredo na URL (não a assinatura nativa da Efí)

A Efí tem um mecanismo de assinatura (`X-Hub-Signature`, HMAC) pros
webhooks, mas não consegui confirmar com certeza de onde vem a chave
secreta desse HMAC nesta sessão (documentação oficial bloqueada, só
busca — e uma das buscas parece ter misturado resultado de um serviço
de terceiros não relacionado, "Boleto Simples"). Em vez de arriscar
implementar esse esquema errado (falso senso de segurança), usei o mesmo
padrão já validado do ZapSign: segredo compartilhado na própria URL
(`/api/webhooks/efi/[secret]`, `EFI_WEBHOOK_SECRET`), comparado com
`timingSafeEqual`. Como sempre reconsulto a cobrança na API antes de
confiar no status (abaixo), a segurança real não depende de acertar o
esquema nativo da Efí.

### Notificação é indireta: token → resolver → reconsultar

Diferente do ZapSign (que manda o documento inteiro no corpo do
webhook), a notificação da Efí só traz um **token** — é preciso chamar
`GET /v1/notification/:token` pra descobrir quais cobranças mudaram, e
depois `GET /v1/charge/:id` de cada uma pra saber o status de verdade.
`extractNotificationToken` (`lib/efi/webhook.ts`) tenta os nomes de
campo mais prováveis (`notification`, `token`) em vez de travar num só —
mesmo espírito defensivo do `extractDocToken` do ZapSign. **O formato
exato da resposta de `/v1/notification/:token` não foi confirmado contra
a API real** — primeiro lugar a conferir se o teste real falhar aqui.

### Mapeamento de status defensivo

`update_invoice_payment_status()` (SQL, `SECURITY DEFINER`, mesmo padrão
das etapas anteriores) só muda o registro quando o status da Efí é
`"paid"` ou `"canceled"` — qualquer outro valor (`"waiting"`,
`"identified"` etc., que eu não confirmei com certeza) não faz nada, em
vez de inventar um mapeamento.

### Pessoa jurídica dentro de `customer`

Cliente CNPJ manda `customer.juridical_person: { corporate_name, cnpj }`
— aninhado **dentro** de `customer`, não como irmão dele (bug real do
teste, abaixo). Cliente CPF manda `customer.cpf`. **Risco conhecido, não
testado ainda:** a Efí pode exigir data de nascimento (`birth`) pra
pagador pessoa física, campo que o sistema não coleta hoje (`client` não
tem esse dado) — só vamos saber quando testarmos com um cliente CPF de
verdade.

### Link do boleto guardado na criação, não buscado sob demanda

Diferente do PDF assinado do ZapSign (Etapa 1.5, onde o link realmente
expira em 60min), não achei evidência de que o link do boleto da Efí
expire — e a resposta de "detalhar cobrança" (`GET /v1/charge/:id`) não
trouxe o link no mesmo formato da resposta de criação (virou mais um
formato pra adivinhar, sem necessidade). Mais simples: `generateBoleto`
já guarda `boleto_url` (e `boleto_barcode`, a linha digitável) na hora da
criação; "Ver boleto" é só um link, sem chamada de servidor.

## Bugs achados no teste real (2026-09-27)

Confirma o aviso já registrado: vários detalhes vieram de busca, não da
documentação oficial lida direto. Quatro coisas não bateram, encontradas
em sequência testando de verdade contra a homologação da Efí:

1. **Telefone precisa vir só com dígitos, sem código de país**
   (`^[1-9]{2}9?[0-9]{8}$`) — o cadastro de cliente (Etapa 1.1) guarda
   telefone como texto livre (parênteses, traço, às vezes `+55`).
   Corrigido com `sanitizePhoneNumber` na fronteira com a Efí, sem mudar
   a validação de cadastro.
2. **`juridical_person` fica dentro de `customer`, não ao lado.** Minha
   primeira tentativa colocou como irmão de `customer` dentro de
   `banking_billet`; a Efí respondeu "Propriedade desconhecida".
3. **A resposta de `POST /v1/charge/one-step` vem embrulhada**
   (`{"code": 200, "data": {"charge_id": ..., ...}}`), não "crua" como eu
   assumi — por isso `charge_id` vinha `undefined` e a URL de consulta
   virava `/v1/charge/undefined` (erro "Tipo inválido: string, esperado
   integer" na propriedade `/id`). `unwrapChargeResponse` aceita os dois
   formatos (cru ou embrulhado) em vez de travar num só.
4. **Consequência do bug 3:** a fatura testada ficou com
   `external_charge_id = "undefined"` (string literal) gravado — precisou
   de um `update` manual no Supabase pra liberar gerar de novo. Isso e o
   ajuste do link do boleto (acima) foram corrigidos juntos.

Depois dos 4 ajustes, o fluxo completo funcionou de ponta a ponta em
homologação: boleto criado, link salvo, "Ver boleto" abrindo.

## Validação

- Migration testada localmente (PostgreSQL 16): status irrelevante não
  muda nada; `"paid"` marca como paga com auditoria; cobrança
  desconhecida dá erro; contexto `anon` só chama a função, não lê
  `invoice` direto; revert limpo.
- `npm run lint`, `typecheck`, `test` (65 testes, incluindo
  `sanitizePhoneNumber` e `unwrapChargeResponse`) e `build` sem erro.
- **Testado de ponta a ponta contra a API real da Efí** (ambiente de
  homologação, sem validade jurídica) pelo dono do produto: autenticação
  mTLS funcionou de primeira; os 4 bugs acima foram achados e corrigidos
  nesse teste; boleto gerado com sucesso, link acessível pela tela.
- **Ainda não testado:** confirmação de pagamento via webhook (fluxo
  completo até `update_invoice_payment_status`), cliente pessoa física
  (CPF).

## Consequências

- Webhook (confirmação de pagamento) segue sem validar de verdade contra
  a Efí — só o fluxo de criação do boleto foi confirmado. Formato da
  resposta de `/v1/notification/:token` continua sem confirmação; se o
  pagamento de teste não atualizar a fatura sozinho, é o primeiro lugar a
  conferir.
- Pix e qualquer regra de juros/multa por atraso ficam de fora desta
  etapa (registrar no backlog se o dono do produto quiser depois).
- Testado só em **homologação** (sem validade jurídica) — trocar pra
  produção é decisão separada do dono do produto (`EFI_CLIENT_ID_PROD`/
  `EFI_CLIENT_SECRET_PROD` já guardados, aguardando).

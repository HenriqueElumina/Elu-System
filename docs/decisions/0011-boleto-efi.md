# ADR 0011 — Financeiro: boleto via Efí

**Status:** Aceito, aguardando teste real (código pronto) — 2026-09-27

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

### Pessoa jurídica em objeto à parte

Cliente CNPJ manda `juridical_person: { corporate_name, cnpj }` junto do
`customer` (sem `cpf`); cliente CPF manda `customer.cpf`. **Risco
conhecido:** a Efí pode exigir data de nascimento (`birth`) pra
pagador pessoa física, campo que o sistema não coleta hoje (`client` não
tem esse dado) — se isso travar um teste real com cliente CPF, é uma
lacuna de cadastro a resolver, não algo pra inventar aqui.

### Link do boleto buscado sob demanda

Mesmo padrão do PDF assinado do ZapSign (Etapa 1.5): não sei se o link
do boleto/PDF da Efí expira, então por precaução `getBoletoUrl` busca um
link novo a cada clique em "Ver boleto", em vez de guardar. A linha
digitável (`boleto_barcode`) é guardada, por ser um valor fixo que não
expira.

## Validação

- Migration testada localmente (PostgreSQL 16): status irrelevante não
  muda nada; `"paid"` marca como paga com auditoria; cobrança
  desconhecida dá erro; contexto `anon` só chama a função, não lê
  `invoice` direto; revert limpo.
- `npm run lint`, `typecheck`, `test` (57 testes) e `build` sem erro.
- **Não testado contra a API real da Efí** — o acesso de rede direto a
  `cobrancas-h.api.efipay.com.br` está bloqueado nesta sessão (mesmo
  bloqueio que o ZapSign teve). Fica pro dono do produto testar em
  produção (Vercel), como fizemos nas etapas anteriores.

## Consequências

- **Vários detalhes vieram de busca, não da documentação oficial lida
  direto** — mais que o ZapSign, porque a Efí é uma integração bem mais
  complexa (mTLS, notificação indireta, pessoa física x jurídica). Espero
  achar mais de 1 bug no teste real; primeiros lugares a suspeitar:
  formato da resposta de `/v1/notification/:token`, nome exato do campo
  de telefone/e-mail esperado pelo `customer`, e se falta `birth` pra
  CPF.
- Pix e qualquer regra de juros/multa por atraso ficam de fora desta
  etapa (registrar no backlog se o dono do produto quiser depois).
- Depende de `APP_BASE_URL`, `EFI_CLIENT_ID`, `EFI_CLIENT_SECRET`,
  `EFI_CERTIFICATE_BASE64`, `EFI_SANDBOX`, `EFI_WEBHOOK_SECRET`
  configurados na Vercel antes do teste real.

# ADR 0019 — Ficha de onboarding do colaborador

**Status:** Aceito — 2026-10-04

## Contexto

Etapa 9.2, continuação direta da Etapa 9.1 (convite e cadastro básico).
O dono do produto esperava que, ao criar a conta pelo link de convite,
o colaborador também preenchesse uma ficha com dados de gestão de
pessoas — contato de emergência, restrição alimentar, objetivos de
carreira, dados pessoais (nascimento, CPF, endereço).

## Decisões

### Ficha e criação de conta são o mesmo passo, não dois

Confirmado com o dono do produto: a ficha é obrigatória pra concluir o
cadastro (não dá pra pular e preencher depois). Por isso ela entra como
campos a mais em `submit_employee_invite`, gravada na mesma chamada
`SECURITY DEFINER` que já cria `employee`/`employee_compensation` — não
uma tela separada exigindo sessão (que na prática talvez nem exista
ainda, se o projeto do Supabase pedir confirmação de e-mail antes do
primeiro login).

### Cada campo da ficha é opcional, só o passo não é

"Obrigatória" foi interpretado como: o formulário aparece e tem que ser
enviado pra terminar o cadastro, mas nenhum campo individual dentro
dele (nome do contato de emergência, CPF etc.) tem checagem de
preenchimento — evita inventar qual subconjunto seria "realmente"
obrigatório, o que não foi perguntado.

### `employee_onboarding` como tabela própria, RLS com o próprio colaborador incluído

Diferente de `employee_compensation` (só `socio`/`financeiro`), aqui o
grupo de acesso é `socio`/`financeiro` **ou o próprio colaborador**
(`profile_id` do `employee` bate com quem está logado) — pra ele poder
corrigir um dado próprio depois (ex.: telefone de emergência mudou).
`gestor` fica de fora, mesmo padrão de `employee_compensation`.

### CPF validado com o dígito verificador, reaproveitando código existente

`isValidCPF` (`lib/validation/document.ts`), já usado pro cadastro de
cliente pessoa física, também valida aqui — sem duplicar a lógica.
Endereço usa os mesmos nomes de campo do endereço de `client`
(`address_zip_code`, `address_street` etc.), por consistência.

## Validação

- Migration testada localmente (PostgreSQL 16, `SET ROLE authenticated`/
  `anon` de verdade): fluxo completo (convite → `auth.signUp` simulado →
  `submit_employee_invite` com ficha completa) grava `employee_onboarding`
  certo, inclusive UF em maiúsculo; o próprio colaborador lê e corrige a
  própria ficha; outro colaborador não vê; `gestor` não vê;
  `socio`/`financeiro` veem; revert limpo.
- **Achado no teste local:** a assinatura da função mudou de 2 pra 16
  parâmetros — Postgres identifica função por nome + tipos dos
  parâmetros, então precisou `drop function` da versão antiga antes de
  criar a nova (já esperado, documentado no comentário da migration).
  Primeira tentativa de `grant execute` também errou a contagem de
  parâmetros (15 em vez de 16) — corrigido e testado de novo do zero
  antes de seguir.
- `npm run lint`, `typecheck`, `build` e Playwright completo sem erro
  (18 testes).

## Consequências

- Colaboradores já cadastrados na Etapa 9.1 (antes desta etapa) não têm
  `employee_onboarding` — ninguém pediu preenchimento retroativo, e o
  padrão do projeto (Etapa 2.1) já é não fazer isso sem pedir.
- Sem tela dedicada pra `socio`/`financeiro` consultarem a ficha ainda
  (só existe no banco) — fica pra quando isso for pedido.
- Sem máscara de CPF/CEP/telefone nos campos (mesma simplificação já
  registrada no backlog pro cadastro de cliente).

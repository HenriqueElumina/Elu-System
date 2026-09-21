# ADR 0013 — Financeiro: conta bancária, baixa vinculada e reversão de pagamento

**Status:** Aceito — 2026-09-29

## Contexto

Pedido do dono do produto depois de usar a Etapa 1.9 (contas a pagar):
como a Elumina tem mais de uma conta bancária, "marcar como paga"
precisa dizer qual conta recebeu/pagou, e precisa ser possível desfazer
uma baixa errada. Confirmado que vale tanto para contas a pagar quanto
para contas a receber (faturas), e que a conta bancária tem só nome,
banco, agência e número da conta.

## Decisões

### Tabela `bank_account` nova, sem editar/desativar nesta etapa

Campos: `name` (apelido), `bank_name`, `agency`, `account_number`,
`active` (default true, pra já deixar espaço pra desativar conta velha
sem apagar histórico, mas sem tela de edição/desativação ainda — ninguém
pediu). Mesmo padrão de acesso do `invoice`/`payable`: `socio` tudo,
`financeiro` lê/escreve, `gestor` só lê, `colaborador` sem acesso.

`invoice` e `payable` ganham `bank_account_id` (nullable no banco — só
fica preenchido depois que a baixa acontece).

### Baixa e reversão via função SQL, não update direto

Diferente do webhook da Efí (Etapa 1.8, sem sessão — por isso
`SECURITY DEFINER`), marcar como pago e reverter são ações de um usuário
autenticado de verdade. Por isso `mark_invoice_paid`,
`revert_invoice_payment`, `mark_payable_paid` e `revert_payable_payment`
são funções `SECURITY INVOKER` (padrão): a RLS de `invoice`/`payable`
continua valendo pra decidir quem pode chamar (só `socio`/`financeiro`
têm a policy de escrita), e `auth.uid()` já é o perfil de verdade —
não precisa reimplementar a checagem de permissão dentro da função.

Cada função faz duas coisas na mesma transação: atualiza o status
(com a trava `where status = 'pending'`/`'paid'`, pra não conseguir
pagar uma fatura já paga nem reverter uma que ainda está pendente) e
grava em `audit_log` (`invoice.marked_paid`, `invoice.payment_reverted`,
`payable.marked_paid`, `payable.payment_reverted`) com `actor_profile_id
= auth.uid()`. Fecha a pendência que já estava registrada no backlog
("auditoria de troca manual de status") — pela primeira vez uma ação
financeira manual grava quem fez o quê, não só o webhook.

Reverter limpa `paid_at` e `bank_account_id`, volta pro status
`pending` — não existe status "revertido" separado, é o mesmo fluxo de
"marcar como paga" de novo, contado como um evento novo no
`audit_log`.

### Tela "Marcar como paga" virou formulário

Em vez de um botão só, agora tem um `<select>` de conta bancária
(carregado das contas com `active = true`) + botão. A ação recusa
salvar sem conta selecionada (recusa tanto no HTML `required` quanto na
`server action`, pra não confiar só no front). Botão "Reverter
pagamento" aparece ao lado das faturas/contas já pagas, com confirmação
(`window.confirm`) antes de chamar a ação — é uma correção de baixa
errada, não op comum do dia a dia.

### Tela nova `/financeiro/contas-bancarias`

Lista + link "+ Nova conta" (só `socio`/`financeiro`). Sem edição por
enquanto — se um dado errado for cadastrado, por ora o jeito é cadastrar
de novo e não usar a errada (`active` dá esse controle mais adiante,
quando/  se precisar de uma tela de editar).

## Validação

- Migration testada localmente (PostgreSQL 16, `SET ROLE authenticated`
  de verdade): `financeiro` cadastra conta bancária e marca
  fatura/payable como paga; `gestor` só lê; `colaborador` sem acesso;
  marcar como paga duas vezes ou reverter uma que não está paga dá erro
  controlado; `audit_log` grava `actor_profile_id` certo nos quatro
  casos; revert (drop de tudo que a migration criou) limpo.
- **Achado durante o teste local:** as novas funções (`SECURITY
  INVOKER`) chamam `auth.uid()` como o perfil autenticado de verdade, e
  isso deu "permission denied for schema auth" no ambiente de teste
  local — faltava `grant usage on schema auth to authenticated` no
  stub local do schema `auth` (as funções anteriores eram todas
  `SECURITY DEFINER`, então nunca precisaram disso). Corrigido só no
  ambiente de teste local; no Supabase real esse grant já existe de
  fábrica, não é algo que esta migration precisa fazer.
- `npm run lint`, `typecheck` e `build` sem erro. 71 testes Vitest
  continuam passando (`CashFlowTransaction` ganhou `bankAccountName`,
  ajustado nos testes existentes). Playwright: novo
  `/financeiro/contas-bancarias` e `/financeiro/contas-bancarias/nova`
  exigem login.

## Consequências

- Fecha o item de backlog "auditoria de troca manual de status do
  contrato" só pra fatura/payable — a troca de status do **contrato**
  em si (`updateContractStatus`) ainda não grava em `audit_log`; continua
  registrado no backlog.
- Sem edição/desativação de conta bancária nesta etapa — cadastro é
  só de criação. Se isso incomodar no uso real, é candidato a próxima
  fatia.
- Reverter pagamento não desfaz nada na Efí (o boleto gerado continua
  existindo lá do lado deles) — é só o registro interno que volta pra
  pendente. Se o boleto tiver sido pago de verdade, reverter aqui é só
  pra corrigir um erro de lançamento, não uma operação financeira real.

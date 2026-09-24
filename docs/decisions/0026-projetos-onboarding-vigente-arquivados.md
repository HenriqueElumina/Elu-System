# ADR 0026 — Projetos agrupados (Onboarding/Vigente/Arquivados) e excluir

**Status:** Aceito — 2026-09-24

## Contexto

Pedido do dono do produto, mesmo padrão já usado em Contratos
(ADRs 0023/0024): `/projetos` agrupado por estágio — Onboarding /
Vigente / Arquivados — com opção de excluir os arquivados.

## Decisões

### Mapeamento direto dos 4 status existentes

`project_status` já tinha `planning` / `active` / `completed` /
`cancelled` desde a Etapa 0.3, sem uso de verdade (todo projeto nascia
e ficava em `planning` pra sempre — nada nunca mudava o status).

- **Onboarding** = Planejamento (`planning`) — estado inicial, todo
  projeto nasce assim quando o contrato é assinado.
- **Vigente** = Ativo (`active`)
- **Arquivados** = Concluído (`completed`) + Cancelado (`cancelled`),
  com botão "Excluir"

Mesma decisão já tomada pra Contratos: sem campo novo no banco,
"Arquivados" é só um agrupamento visual por status.

### Precisou criar o que faltava: mudar o status de um projeto

Diferente de Contratos (que já tinha `updateContractStatus`), não
existia **nenhum** jeito de mudar o status de um projeto em lugar
nenhum do sistema. `updateProjectStatus` (nova) + seletor de status
compacto em cada linha (`status-select.tsx`, mesmo padrão de
Contratos) resolvem isso — sem essa ação, nenhum projeto jamais sairia
de "Onboarding".

### Excluir usa o `deleted_at` que já existia

Mesmo padrão de Leads/Contratos: soft delete, só na seção "Arquivados",
só `socio`/`gestor` (`colaborador` continua só lendo, mesma regra de
sempre).

### `lib/validation/project.ts` ganhou `PROJECT_STATUSES`

Só existia `PROJECT_STATUS_LABELS` (um `Record<string, string>`, sem
lista dos valores válidos) — precisava de um array tipado pra montar o
`<select>` e validar a action, então ganhou o mesmo formato de
`CONTRACT_STATUSES`/`LEAD_STATUSES`.

## Validação

- `npm run lint`, `typecheck`, `test` (89 testes, sem novo — RLS
  já existente cobre as duas ações) e `build` sem erro; Playwright
  completo sem erro (18 testes).
- Verificação visual (seletor de status em cada linha, "Excluir" só em
  Arquivados) com rota temporária e dados de exemplo, removida antes
  do commit.

## Consequências

- Sem auditoria de quem mudou status ou excluiu — mesmo padrão de
  outras ações administrativas que ainda não gravam em `audit_log`.
- Sem máquina de estados — o seletor permite qualquer transição, igual
  ao que já valia pra Contratos.

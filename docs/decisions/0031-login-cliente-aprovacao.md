# ADR 0031 — Login de cliente e aprovação real de demandas (Etapa Workflow.2)

**Status:** Aceito — 2026-09-25

## Contexto

Desde a Etapa Workflow.1, "Aprovado/Agendado" era decidido manualmente por
sócio/gestor, confirmando com o cliente por fora do sistema (WhatsApp,
e-mail) — a base (`update_content_demand_status` carimbando
`approved_at`/`approved_by`) já estava pronta pra essa etapa. Esta etapa dá
ao cliente um login de verdade e a capacidade de aprovar (ou pedir ajuste)
direto pelo sistema, pela primeira vez.

Escopo confirmado com o dono do produto: **só** a aprovação de demandas do
Workflow. O Portal do Cliente completo (financeiro, relatórios, NPS,
solicitações) continua Onda 3 — maior, fora daqui.

## Decisões

### `profile.client_id`: primeira role com isolamento por registro

Até aqui, todo perfil interno (sócio/financeiro/gestor/colaborador) tinha
acesso amplo (com algumas exceções de escrita) — nenhum perfil era restrito
a "só os dados de um registro específico". `cliente` é o primeiro: uma nova
coluna `profile.client_id` (nullable, só preenchida quando `role =
'cliente'`) amarra a conta a um cliente específico, e toda RLS nova desta
etapa filtra por ela.

### Convite por pessoa, mesmo padrão do colaborador (Etapa 9.1)

Confirmado com o dono do produto: cada pessoa do cliente que precisar
acessar recebe seu próprio convite/login (não um login único
compartilhado pela empresa) — dá pra saber exatamente quem aprovou o quê,
e permite convidar mais de um contato da mesma empresa. `client_user_invite`
é uma cópia quase exata de `employee_invite`, mais simples (só e-mail +
`client_id`, sem cargo/custo/admissão). `submit_client_user_invite` é o
único lugar que promove um profile recém-criado (que `handle_new_user()`
sempre grava como `'colaborador')` para `'cliente'` — só acontece validando
um token de convite de verdade, com e-mail batendo, mesma lógica de
segurança já usada no convite de colaborador.

### `content_demand`: cliente só vê a própria demanda, e só enquanto está aguardando aprovação

`content_demand_select_cliente` (nova policy) filtra por `client_id` do
próprio perfil **e** `status = 'awaiting_approval'` — não o histórico
completo. Decisão deliberada: campos como `briefing`, `tags` e
`assigned_to` são informação interna (instrução de criação, marcação de
equipe), não fazem sentido expostos ao cliente; e uma vez aprovada ou
com ajuste pedido, a demanda simplesmente sai da lista de pendências do
cliente — como uma caixa de entrada. A tela `/portal` só consulta os
campos relevantes pro cliente (título, canais, data prevista, legenda,
link do material final com pré-visualização).

### "Aprovar" reaproveita `update_content_demand_status`, com uma transição só liberada

Estendida (não duplicada) pra aceitar `role = 'cliente'`, mas travada:
só quando o `client_id` da demanda bate com o do perfil, a demanda está
`awaiting_approval`, e o destino é exatamente `approved_scheduled`.
Qualquer outra tentativa (aprovar demanda de outro cliente, pular estágio,
etc.) é bloqueada com uma mensagem clara. O carimbo de quem aprovou
(`approved_by = auth.uid()`) passa a registrar o profile do cliente,
exatamente como a Workflow.1 já previa.

### "Pedir ajuste": função nova, com observação obrigatória

Confirmado com o dono do produto: pedir ajuste volta a demanda pra "Em
produção" com uma observação obrigatória (`content_demand.client_feedback`,
nova coluna) — sem isso o responsável interno não saberia o que mudar. Função
separada (`request_content_demand_changes`) em vez de sobrecarregar
`update_content_demand_status`, porque tem uma regra a mais (nota
obrigatória) e um efeito colateral próprio (voltar estágio + gravar
feedback) que não se aplica a nenhum outro papel.

### Correção de RLS encontrada no caminho: `profile_select`

A policy original da Fundação (`profile_select`, Etapa 0.3) só deixa cada
um ver a própria linha ou sócio ver todas — gestor não enxergaria quem já
tem login de cliente, mesmo podendo convidar (mesma permissão de
`client_user_invite`). Nova policy aditiva e restrita
(`profile_select_client_users`) libera sócio/gestor pra ver só perfis com
`role = 'cliente'` — nunca abre profile de colaborador/sócio/financeiro
pra gestor.

### Tela do cliente reaproveita o `AppShell`, sem sidebar de módulos

`/portal` usa o mesmo `AppShell` das telas internas — como nenhum item de
`NAV_LINKS` lista `'cliente'` nos `roles`, a sidebar aparece vazia (só
logo, nome/perfil e "Sair"), sem precisar construir um shell novo. Simples
e consistente com o resto do app.

### Redirecionamento pós-login por perfil

`lib/supabase/middleware.ts`: ao logar, sócio/financeiro/gestor/colaborador
continuam indo pra `/clientes`; `cliente` vai pra `/portal`. Único ponto
que precisou saber a role no momento do redirecionamento (antes só checava
`active`).

## Validação

- Migration testada localmente (PostgreSQL 16, `SET ROLE authenticated` de
  verdade, dois clientes diferentes pra testar isolamento): convite gerado
  por sócio; `get_client_user_invite` funciona como `anon`; signup
  simulado (insert em `auth.users`, trigger cria profile `colaborador`)
  seguido de `submit_client_user_invite` promove pra `cliente` com o
  `client_id` certo; cliente A enxerga só a própria demanda (não a do
  cliente B); aprova a própria com sucesso (carimba `approved_by`);
  bloqueado ao tentar aprovar a demanda do cliente B; pede ajuste com
  sucesso (status volta, `client_feedback` grava); bloqueado sem
  observação; bloqueado pedindo ajuste na demanda do cliente B; gestor
  enxerga o profile do cliente (`profile_select_client_users`),
  colaborador não. Revert/reaplicação limpos.
- `npm run lint`, `typecheck`, `test` (121 testes, 8 novos) e `build` sem
  erro; Playwright completo sem erro (23 testes, 3 novos —
  `/portal` e `/clientes/[id]/convidar-login` exigem login,
  `/convite-cliente/[token]` inválido mostra mensagem amigável sem exigir
  login).
- Verificação visual (`/portal` com dois cartões de demanda, incluindo o
  formulário de "Pedir ajuste" expandido; seção "Acessos" em
  `/clientes/[id]`) com rota temporária e dados de exemplo, removida antes
  do commit.

## Consequências

- Sem edição/reenvio de convite de cliente expirado, sem desativar login
  de cliente pela tela (mesma pendência já registrada pra colaborador) —
  registrado no backlog.
- Sem histórico de aprovações/ajustes pro cliente ver (assim que
  aprovada ou com ajuste pedido, a demanda sai da lista) — decisão
  deliberada de manter a tela simples, uma "caixa de entrada".
- Sem notificação (e-mail/WhatsApp) avisando o cliente que uma demanda
  está esperando aprovação — ele precisa entrar no sistema pra saber.
  Registrado no backlog (módulo de automações/notificações, Onda 4).

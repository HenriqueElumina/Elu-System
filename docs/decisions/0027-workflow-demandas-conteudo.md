# ADR 0027 — Workflow: quadro de demandas de conteúdo (Etapa Workflow.1)

**Status:** Aceito — 2026-09-24

## Contexto

Pedido do dono do produto, com print de referência (mLabs): uma nova
aba dentro de Projetos, "Workflow" — o "core operacional da agência",
onde sobem demandas (post, arte, vídeo, artigo) pra cada colaborador,
acompanhadas desde a criação até aprovação e publicação. Cobre
"aprovação de conteúdo e vídeo", já prevista pro escopo da Onda 2 em
que estamos (não é avanço de onda).

Escopo grande demais pra uma etapa só — dividido em duas, confirmado
com o dono do produto:
- **Workflow.1** (esta etapa): o quadro em si, sem login de cliente.
- **Workflow.2** (próxima): cliente aprova pelo sistema — precisa de
  login de cliente, que hoje não existe (`client_invite` é só
  formulário de cadastro, não dá acesso a nada).

## Decisões

### Quadro novo e separado, não mexe no sistema de tarefas existente

Confirmado com o dono do produto. `content_demand` é uma tabela nova,
sem relação com `task` (tarefas do playbook, Etapa 2.1) — propósitos
diferentes: `task` é checklist administrativo do serviço vendido;
`content_demand` é uma peça de conteúdo até ser publicada. As telas
`/projetos` e `/projetos/[id]` (com suas tarefas) continuam exatamente
como estavam.

### Funil simplificado: 5 estágios, não os 8 da referência

Rascunho → Em produção → Aguardando aprovação → Aprovado/Agendado →
Concluído. A referência separa "Aprovação interna" de "Aprovação do
cliente" e tem "Ajustes"/"Aguardando agendamento" como estágios à
parte — decidido começar mais simples e detalhar depois, com uso real,
se fizer falta (registrado no backlog).

### "Aprovado/Agendado" nesta etapa é decisão manual de sócio/gestor

Sem login de cliente ainda, `update_content_demand_status` carimba
`approved_at`/`approved_by` quando alguém marca "Aprovado/Agendado" —
pressupõe que sócio/gestor confirmou com o cliente por fora do sistema
(WhatsApp, e-mail). O carimbo é a base pronta pra Workflow.2: quando o
cliente aprovar pelo sistema de verdade, é só essa mesma função virar
acessível pro perfil `cliente` (com a trava de isolamento por
`client_id`).

**Correção no meio do teste local:** a primeira versão apagava
`approved_at`/`approved_by` sempre que o status saía de
"Aprovado/Agendado" — inclusive indo pra "Concluído" (fluxo normal
depois de publicar), perdendo o registro de quem aprovou. Corrigido pra
só carimbar, nunca apagar.

### Mesmo padrão de permissão de `task`

`content_demand_select`: sócio/gestor/colaborador (sem financeiro, não
mexe em operação). Escrita direta (criar, editar campos) só
sócio/gestor — colaborador não cria demanda, só é atribuído a uma.
Mudar status é a única coisa que colaborador faz, e só na própria
demanda (`update_content_demand_status`, mesmo formato de
`update_task_status`, checando `assigned_to = auth.uid()`).

### Canais e mídia simplificados nesta etapa

Canais (Instagram, Facebook, TikTok etc.) são só marcador visual — uma
lista fixa em código (`text[]` no banco, não enum), sem integração de
postagem real. Mídia é só um campo de link (colar URL do Drive, por
exemplo) — upload de arquivo de verdade é Supabase Storage, fatia
própria, fora do escopo aqui. Tags são um campo de texto separado por
vírgula, convertido em array no servidor — sem componente de tag
dedicado ainda.

### Sidebar: "Projetos" vira categoria com "Workflow" ao lado

Mesmo padrão do Financeiro (ADR 0025) — `NavLink.children` já existia,
só reaproveitado.

## Validação

- Migration testada localmente (PostgreSQL 16, `SET ROLE authenticated`
  de verdade): sócio cria demanda; colaborador não atribuído é
  bloqueado ao tentar mudar status; colaborador atribuído consegue;
  financeiro não enxerga nada (RLS `select`); carimbo de aprovação
  preservado ao mover pra "Concluído" (achado e corrigido no teste).
- `npm run lint`, `typecheck`, `test` (92 testes, 2 novos —
  `parseTags` e as subcategorias de Projetos no teste de navegação) e
  `build` sem erro; Playwright completo sem erro (19 testes, 1 novo —
  redirecionamento de `/projetos/workflow` sem login).
- Verificação visual (board com 5 colunas, cards, seletor de status,
  sidebar expandindo Projetos → Workflow) com rota temporária e dados
  de exemplo, removida antes do commit.

## Consequências

- Sem tela de detalhe da demanda (`/projetos/workflow/[id]`) — tudo
  fica visível no card do quadro por enquanto. Se os campos crescerem
  (comentários, histórico, mais mídia), vira uma fatia própria.
- Sem editar/duplicar/excluir demanda ainda — só criar e mudar status,
  igual foi pedido. Registrado no backlog.
- Sem auditoria de quem mudou status (mesmo padrão de outras ações
  administrativas que ainda não gravam em `audit_log`).
- "Aguardando aprovação" ainda depende de alguém do time confirmar com
  o cliente por fora do sistema — resolve na Workflow.2.

# ADR 0030 — Workflow: link de material bruto separado do material final (Etapa Workflow.5)

**Status:** Aceito — 2026-09-24

## Contexto

A Etapa Workflow.4 (ADR 0029) tratava `media_url` como um campo só,
colado na criação da demanda, com pré-visualização. Na prática, o fluxo
real tem dois momentos diferentes: quem cria a demanda cola o link do
**material bruto** (fotos/vídeos crus, sem edição); o editor, ao terminar
a arte/vídeo, cola o link do **material final** — que é o que precisa
aparecer com pré-visualização na hora de aprovar.

## Decisões

### Dois campos, dois momentos, uma só pré-visualização

- `media_url` (já existia) continua sendo preenchido na criação da
  demanda — agora rotulado "Link do material bruto" no formulário e na
  tela de detalhe. **Perdeu** a pré-visualização que ganhou na Etapa
  Workflow.4 (não faz sentido pré-visualizar bruto).
- `final_media_url` (novo, `content_demand.final_media_url`) — só
  preenchido depois, pelo editor, na tela de detalhe. É o único que
  ganha pré-visualização (`resolveMediaPreview`, mesma lógica da Etapa
  Workflow.4, sem mudança).

### Material final editável a qualquer momento, mesmo padrão da legenda

`update_content_demand_final_media` — nova função `SECURITY DEFINER`,
idêntica em estrutura a `update_content_demand_caption` (sócio/gestor
sempre podem; colaborador só na própria demanda atribuída). Confirmado
com o dono do produto: mesma regra da legenda, porque normalmente quem
edita a legenda final é a mesma pessoa que sobe o material final.

### Demandas já existentes: sem migração de dados

O link que já estava em `media_url` nas demandas criadas antes desta
etapa (ex.: "Post Maxxi Tacos") permanece só como material bruto —
`final_media_url` começa vazio para elas. Confirmado com o dono do
produto: sem problema, o editor cola o link final normalmente daqui pra
frente. Decisão consciente de não tentar adivinhar, pra cada demanda
antiga, se o link que já estava lá era bruto ou final.

## Validação

- Migration testada localmente (PostgreSQL 16, `SET ROLE authenticated`
  de verdade): sócio e colaborador atribuído editam o material final;
  colaborador não atribuído e financeiro bloqueados — mesmos resultados
  já validados pra legenda na Etapa Workflow.4.
- `npm run lint`, `typecheck`, `test` (112 testes) e `build` sem erro;
  Playwright completo sem erro (20 testes).
- Verificação visual (os dois campos lado a lado, "Editar link" no
  material final, ausência de preview no material bruto) com rota
  temporária e dados de exemplo, removida antes do commit.

## Consequências

- **Lição da etapa anterior aplicada aqui:** a migration
  `20261009090000_workflow_material_final.sql` também precisa ser
  aplicada manualmente no Supabase real antes de usar — mesma pendência
  já vivida na Workflow.4 (ver correção registrada no ADR 0029 e em
  `docs/progress.md`). Avisado de antemão no resumo desta etapa.
- Sem edição do link do material bruto depois de criada a demanda —
  só o material final é editável. Se precisar trocar o bruto, fica
  fora de escopo por enquanto (registrado no backlog).

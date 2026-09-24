# ADR 0029 — Workflow: legenda e pré-visualização da mídia (Etapa Workflow.4)

**Status:** Aceito — 2026-09-24

## Contexto

O dono do produto usa hoje o mLabs, que mostra a peça de conteúdo "como
vai ficar postada" — miniatura da imagem/vídeo ao lado da legenda final,
simulando o Instagram — na hora de aprovar. Ele perguntou se deveríamos
trazer esse comportamento pro Elu System, e junto surgiu a dúvida sobre
subir o arquivo de mídia pro nosso sistema (armazenamento, custo, risco
de travamento em upload de vídeo grande via função serverless).

Decisão separada em duas partes: **onde o arquivo mora** e **como ele
aparece pra quem aprova**. A primeira parte já estava decidida (ver
`docs/backlog.md` e a conversa registrada) — continuamos sem hospedar
mídia no sistema, só um link (Drive, o mais comum no fluxo atual). Esta
etapa resolve só a segunda parte: pré-visualizar o que já está no link,
sem guardar o arquivo.

## Decisões

### Legenda como campo novo, separado do briefing

`content_demand` ganha `caption` (nova coluna, nullable). Diferente do
`briefing` (instrução de criação pra quem vai produzir a peça), a legenda
é o texto final do post — o que efetivamente sai publicado. Limite de
2200 caracteres, mesmo teto do Instagram.

### Legenda editável a qualquer momento (diferente do resto da demanda)

Único campo da demanda que pode ser alterado depois de criada — decisão
explícita do dono do produto, porque legenda naturalmente é revisada indo
e voltando durante a aprovação. Implementado com uma função
`SECURITY DEFINER` própria (`update_content_demand_caption`), mesmo
padrão e mesma checagem de permissão de `update_content_demand_status`
(sócio/gestor sempre podem; colaborador só na própria demanda atribuída).
Editar os outros campos (título, canais, data, briefing, link) continua
fora de escopo — registrado no backlog desde a Etapa Workflow.1.

### Pré-visualização sem hospedar arquivo: reconhece o link, não guarda nada

Função pura `resolveMediaPreview` (`lib/workflow/media-preview.ts`)
classifica o link em três casos:
- **Imagem direta** (URL terminando em `.jpg`/`.png`/`.webp`/etc.) → mostra
  a imagem com uma tag `<img>` simples, direto do link original.
- **Google Drive** (`drive.google.com/file/d/ID/...` ou
  `drive.google.com/open?id=ID`) → converte pro formato de embed nativo do
  Drive (`/file/d/ID/preview`) e mostra num `<iframe>` — funciona tanto
  pra imagem quanto pra vídeo, porque é o próprio player do Drive.
- **Qualquer outro link** → sem pré-visualização, continua só como link
  clicável (comportamento de hoje, não quebra nada).

Sem nenhuma chamada de rede do nosso lado pra "baixar e guardar" — o
navegador de quem está aprovando busca a imagem ou o embed direto na
fonte, exatamente como um link comum de imagem em qualquer site.

### Limitação avisada ao dono do produto: depende do compartilhamento no Drive

O preview do Drive só funciona se o arquivo estiver compartilhado como
"Qualquer pessoa com o link pode visualizar". Se o editor esquecer de
configurar isso, quem for aprovar vê uma tela de permissão negada dentro
do preview — não é algo que o Elu System resolve sozinho, é hábito de
quem sobe o arquivo no Drive.

## Validação

- `lib/workflow/media-preview.ts`: 8 testes (link vazio/inválido, imagem
  com extensão maiúscula/minúscula, Drive nos dois formatos de URL
  conhecidos, Drive sem id reconhecível, e qualquer outro link caindo em
  "sem preview").
- Migration testada localmente (PostgreSQL 16, `SET ROLE authenticated`
  de verdade): sócio edita legenda; colaborador atribuído edita; colaborador
  não atribuído bloqueado; financeiro bloqueado — todos com a mensagem de
  erro esperada.
- `npm run lint`, `typecheck`, `test` (112 testes, 8 novos) e `build` sem
  erro; Playwright completo sem erro (20 testes).
- Verificação visual (campo Legenda com "Editar legenda", estrutura da
  pré-visualização de imagem e do embed do Drive) com rota temporária e
  dados de exemplo. **Ressalva:** o ambiente desta sessão não tem acesso
  de rede a `images.unsplash.com`/`drive.google.com` (proxy do sandbox
  bloqueia, confirmado com `curl`), então só a estrutura/HTML foi
  verificada visualmente — o carregamento real da imagem/embed só é
  validável em produção (Vercel tem internet completa).

## Consequências

- Sem upload de arquivo pelo sistema — decisão mantida, registrada aqui e
  no backlog.
- Sem pré-visualização pra vídeo hospedado fora do Drive (ex.: um link
  direto de `.mp4`) — caso raro no fluxo atual do time, mas fica marcado
  como possível extensão futura se aparecer necessidade real.
- Legenda não é por canal (uma só, compartilhada entre Instagram,
  Facebook etc.) — simplificação consciente, "simples primeiro".

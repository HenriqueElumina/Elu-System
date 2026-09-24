# ADR 0025 — Financeiro como categoria com subcategorias na sidebar

**Status:** Aceito — 2026-09-24

## Contexto

O dono do produto mandou um print de referência (ERP da Olist): lá,
"Finanças" é uma categoria que expande subcategorias (Caixa, Contas a
Pagar, Contas a Receber etc.) — diferente do nosso sistema, onde
"Financeiro" era só mais um item solto na sidebar, e as sub-telas
(Contas a pagar, Fluxo de caixa, Contas bancárias) só eram alcançáveis
por links repetidos no topo de cada tela do módulo.

## Decisões

### Adaptação do conceito, não cópia do layout

O ERP de referência usa duas colunas (barra de ícones + painel
contextual). Nossa sidebar é uma lista só — em vez de replicar duas
colunas, o conceito "categoria com subcategorias" virou um item que
expande subitens indentados embaixo dele, dentro da mesma lista.

### Subitens só aparecem quando você está em alguma tela do Financeiro

Pra não poluir a sidebar nas outras ~20 telas do sistema, os 4 subitens
(Contas a receber / Contas a pagar / Fluxo de caixa / Contas bancárias)
só aparecem quando o caminho atual começa com `/financeiro` — mesma
lógica de `pathname.startsWith`, sem estado de "aberto/fechado" pra
gerenciar, sem clique extra. `NavLink` ganhou um campo opcional
`children` (`lib/nav/links.ts`); `AppShell` (sidebar) sabe renderizar
esse nível a mais e marcar o subitem certo como ativo.

### Removidos os links repetidos dentro de cada tela do Financeiro

`/financeiro`, `/financeiro/contas-a-pagar`, `/financeiro/fluxo-de-caixa`
e `/financeiro/contas-bancarias` tinham, cada uma, uma fileira de links
pras telas irmãs (ex.: "Contas a pagar → / Fluxo de caixa → / Contas
bancárias →") — ficaram redundantes com o menu novo e foram removidos.
Nenhuma tela mudou o conteúdo, só o cabeçalho.

## Validação

- Teste novo (`navLinksForRole`) confirma que Financeiro tem as 4
  subcategorias na ordem certa e que nenhum outro módulo ganhou
  `children` sem querer.
- `npm run lint`, `typecheck`, `test` (87 testes) e `build` sem erro;
  Playwright completo sem erro (18 testes).
- Verificação visual: sidebar expandindo/marcando o subitem certo,
  testada com uma prop temporária (`previewPathname`) numa rota de
  preview — prop e rota removidas antes do commit, sem vestígio no
  código.

## Consequências

- Se um novo módulo precisar do mesmo padrão categoria/subcategoria no
  futuro, o mecanismo (`children` em `NavLink`) já existe — só declarar
  os subitens em `lib/nav/links.ts`.

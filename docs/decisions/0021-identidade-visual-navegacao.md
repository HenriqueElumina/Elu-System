# ADR 0021 — Identidade visual e navegação responsiva

**Status:** Aceito — 2026-09-24

## Contexto

Etapa UX.1. Antes de seguir pra próxima fase de negócio, o dono do
produto pediu pra olhar UX e identidade visual do sistema, incluindo uma
versão responsiva pra mobile. Até aqui não existia nenhuma marca aplicada
(cores, tipografia, logo) nem navegação entre módulos — cada uma das ~23
telas internas montava o próprio cabeçalho na mão, sem menu, sem link
consistente pra outros módulos.

## Decisões

### Cores e tipografia extraídas do material da marca

O dono do produto enviou o logo da Elumina Partners (duas versões: carvão
`#20232a` pra fundo claro, bege `#e6ddcc` pra fundo escuro — cores
extraídas por amostragem direta dos arquivos, não estimadas visualmente)
e informou as fontes oficiais **NOAH** (títulos/wordmark) e **Poppins**
(texto). Como NOAH é uma fonte comercial sem arquivo disponível nesta
sessão, usei **Poppins em tudo** por enquanto (via `next/font/google`,
sem custo, sem novo arquivo pra hospedar). Se o dono do produto enviar os
arquivos da NOAH depois, é uma troca pequena e isolada em `app/layout.tsx`
e `tailwind.config.ts`.

### Navegação: sidebar fixa no desktop, gaveta no mobile

Confirmado com o dono do produto: menu lateral fixo no desktop. Criado um
componente único, `components/app-shell.tsx`, com sidebar carvão contendo
logo, módulos (filtrados por perfil) e rodapé com nome/perfil/sair; abaixo
do breakpoint `lg`, vira uma barra superior com hambúrguer que abre uma
gaveta com o mesmo conteúdo.

Os módulos e perfis que enxergam cada um vêm de `lib/nav/links.ts`,
espelhando exatamente a checagem de perfil que cada `page.tsx` já fazia
(ex.: Financeiro não aparece pra `colaborador`; Projetos não aparece pra
`financeiro`) — não inventei nenhuma regra nova de acesso, só copiei a
que já existia pra um lugar visível.

### Todas as ~23 telas internas trocaram o cabeçalho manual pelo AppShell

Mecânico: cada `page.tsx` autenticado passou a envolver seu conteúdo em
`<AppShell userName={...} userRole={...}>`, sem mudar tabelas, formulários
ou regras de negócio de nenhuma tela. Isso exigiu adicionar `full_name` ao
`select` de perfil em telas que só buscavam `role` até então (não
adicionava overhead relevante — mesma linha, mesma tabela). Breadcrumbs
manuais pra **outros módulos** (ex. "← Clientes" dentro de Serviços) foram
removidos por ficarem redundantes com a sidebar; breadcrumbs **dentro do
mesmo módulo** (ex. "← Voltar" de um detalhe pra sua lista, ou os links
entre as sub-telas do Financeiro) foram mantidos, porque a sidebar só tem
uma entrada por módulo.

A tela de login não entrou nessa troca — ela é pública, sem sidebar.

### O que ficou de fora desta etapa (registrado no backlog)

- Redesenhar tabelas, formulários e botões internos de cada tela — isso é
  polimento tela a tela, próximas etapas, sob demanda.
- Modo escuro.
- Trocar Poppins pela NOAH nos títulos (aguardando arquivo da fonte).

## Validação

- `npm run typecheck`, `lint`, `test` (82 testes, incluindo um novo pra
  `navLinksForRole`) e `build` sem erro.
- Playwright (18 testes) sem erro — cobre só os fluxos públicos/não
  autenticados que já existiam (o projeto não tem usuário de teste
  seedado contra o Supabase real, então não dá pra automatizar um teste
  de ponta a ponta logado da sidebar — mesma limitação dos specs
  existentes).
- Verificação visual da sidebar/gaveta mobile feita manualmente: criei
  uma rota temporária (`app/preview-shell-temp`) renderizando o
  `AppShell` com dados de exemplo, tirei screenshots (desktop, mobile
  fechado, mobile com a gaveta aberta) e **removi a rota antes de
  commitar** — não ficou nenhum vestígio no código.

## Consequências

- Sem a fonte NOAH real, os títulos não batem 100% com a identidade
  oficial ainda — visualmente é Poppins em peso mais forte no lugar dela.
- A validação de verdade (login real, perfis diferentes, mobile de
  verdade) depende do dono do produto testar em produção — não foi
  possível autenticar contra o Supabase real nesta sessão.

# Visão do produto e MVP — Elu System

> Escopo desta Etapa 0.2: mapa de módulos por onda, perfis de acesso e o
> recorte do MVP da Onda 1. Ainda sem schema de banco (isso é a Etapa 0.3).

## 1. Mapa de módulos por onda

| # | Módulo | Onda |
|---|---|---|
| 1 | Fundação | 1 |
| 2 | Catálogo de serviços e playbooks | 1 |
| 3 | Comercial | 1 |
| 4 | Financeiro | 1 |
| 5 | Tarefas e projetos | 2 |
| 6 | Conteúdo (social) | 2 |
| 7 | Audiovisual | 2 |
| 9 | Colaboradores (RH) | 2 (onboarding e cadastro básico antecipados na Onda 1, ver seção 3) |
| 10 | Capacidade e rentabilidade | 2 |
| 13 | Aprendizado | 2 (versão simples antecipada, ver seção 3) |
| 8 | Marketplace | 3 |
| 11 | Portal do cliente | 3 |
| 12 | Sucesso do cliente (CS) | 3 |
| 14 | Marketing da agência | 4 |
| 15 | Painel dos sócios | 4 (versão avançada; um recorte simples pode nascer já na Onda 2/3 junto de Capacidade) |
| 16 | Transversais (cofre, automações, IA) | Cofre entra quando houver credencial sensível para guardar (Onda 1/2); automações e IA ficam para depois |

Isso segue exatamente a ordem de ondas definida no `CLAUDE.md` (seção 4).
Como o `CLAUDE.md` já pede para **antecipar playbooks, onboarding de
colaboradores e base de conhecimento simples** por causa das contratações,
o MVP da Onda 1 (seção 3) inclui uma versão minúscula de cadastro de
colaborador — sem o módulo de RH completo.

## 2. Perfis de acesso

| Perfil | Descrição | Acesso no MVP (Onda 1) |
|---|---|---|
| `socio` | Admin total | Tudo: clientes, catálogo, comercial, contratos, financeiro completo (incl. custo, se já existir), auditoria |
| `financeiro` | Operação financeira | Contas a receber/pagar, cobrança, NFSe, fluxo de caixa. Sem editar catálogo/comercial |
| `gestor` | Gestão de conta/projeto | Clientes, catálogo (leitura), comercial (leads/propostas/contratos dos seus clientes), sem dados financeiros sensíveis (valores de custo) |
| `colaborador` | Time interno | Vê clientes e projetos em que está alocado; sem acesso a financeiro ou dados de outros clientes |
| `freelancer` | Acesso restrito | Fora do escopo do MVP da Onda 1 (chega junto do módulo de Tarefas/Audiovisual na Onda 2) |
| `cliente` | Portal do cliente | Fora do escopo do MVP da Onda 1 (Portal é Onda 3) — no MVP o cliente não acessa o sistema |

Princípio de menor privilégio mantido: dados financeiros (valores, custo) e
credenciais visíveis só para `socio` e `financeiro`. Isolamento entre
clientes é feito por RLS no banco desde a Etapa 0.3, não apenas por
esconder botão na tela.

## 3. Recorte do MVP — Onda 1

Fatia vertical (banco → API → tela) que precisa funcionar de ponta a ponta:
**cadastrar cliente → catalogar serviço → gerar proposta → fechar venda →
gerar contrato assinado digitalmente → handoff automático para
operação → cobrar recorrência.**

### 3.1 Fundação
- Auth (Supabase Auth) + perfis: `socio`, `financeiro`, `gestor`,
  `colaborador` (os 4 usados no MVP; `freelancer` e `cliente` entram depois).
- Cadastro de cliente e contato do cliente.
- Cadastro de colaborador (nome, e-mail, perfil de acesso) — **sem** módulo
  de RH completo (custo/hora, ausências, metas ficam para a Onda 2).
- Cadastro de serviço (nome, descrição, preço-base).
- Log de auditoria para ações sensíveis (financeiro, contratos, permissões).

### 3.2 Catálogo de serviços e playbooks
- Serviço com etapas/checklist e SLA associado (o "playbook").
- Templates de tarefa do playbook — usados no handoff automático (3.3).
- **Fora do MVP:** versionamento avançado de playbook, biblioteca de
  templates reutilizáveis entre serviços parecidos (fica como melhoria).

### 3.3 Comercial
- Pipeline simples: lead → proposta → contrato.
- Proposta gerada a partir do catálogo, **registrada como dados internos**
  (itens, valores, condições) — sem gerar PDF com identidade visual ainda;
  envio ao cliente é manual (e-mail/WhatsApp com o resumo).
- Contrato com **assinatura digital integrada** (Clicksign ou ZapSign —
  qual dos dois será decidido na etapa de construção deste módulo,
  registrado em `docs/backlog.md`).
- **Handoff automático venda → operação:** ao marcar o negócio como
  "ganho", o sistema cria automaticamente: cliente (se novo), projeto,
  tarefas de onboarding a partir do playbook do serviço vendido, e a
  cobrança recorrente correspondente no financeiro.

### 3.4 Financeiro
- Contas a receber com recorrência (cobrança mensal gerada a partir do
  contrato).
- Boleto/Pix via Efí.
- NFSe: **pendente** — fica implementado assim que o provedor for
  confirmado com o contador (ver `docs/backlog.md`); até lá, emissão fica
  manual por fora do sistema.
- Contas a pagar simples (lançamento manual) e fluxo de caixa básico
  (entradas e saídas).
- **Fora do MVP:** DRE por cliente/serviço, reajuste anual automático,
  régua de cobrança com régua de inadimplência avançada, conciliação
  bancária automática — todos ficam para a Onda 2, quando o módulo de
  Capacidade e Rentabilidade trouxer custo/hora dos colaboradores.

## 4. Explicitamente fora do MVP da Onda 1

- Portal do cliente (Onda 3).
- Módulo de RH completo: custo/hora, ausências, metas, 1:1, recrutamento
  (Onda 2) — só o cadastro básico do colaborador entra agora.
- Tarefas/Kanban completo, registro de tempo, capacidade (Onda 2).
- Conteúdo, Audiovisual, Marketplace (Onda 2/3).
- CS, aprendizado avançado, marketing da agência, IA, painel avançado dos
  sócios (Onda 3/4).
- PDF de proposta com identidade visual, DRE, reajuste automático (ver
  seção 3.4).

## 5. Decisões pendentes dentro do MVP

Registradas em `docs/backlog.md`:
- Provedor de NFSe (Focus NFe / PlugNotas / eNotas) — validar com contador.
- Provedor de assinatura digital (Clicksign ou ZapSign) — decidir na
  construção do módulo Comercial.

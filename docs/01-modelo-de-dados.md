# Modelo de dados — Fundação (Etapa 0.3)

> Escopo: só as tabelas da Fundação (módulo 1), conforme `docs/00-visao.md`.
> Sem tabelas de Catálogo/playbook, Comercial (lead/proposal), Financeiro
> (invoice/payment/payable) ou Tarefas (task/time_entry) — essas entram nas
> etapas dos respectivos módulos.
>
> SQL em `supabase/migrations/20260919120000_foundation_schema.sql`.
> Testado localmente (aplicar → inserir dados → violar constraints →
> reverter → reaplicar) com PostgreSQL 16 antes de comitar.

## ERD

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILE : "1 conta"
    PROFILE ||--|| EMPLOYEE : "1 colaborador"
    PROFILE ||--o{ AUDIT_LOG : "autor de"
    CLIENT ||--o{ CLIENT_CONTACT : tem
    CLIENT ||--o{ CONTRACT : possui
    CLIENT ||--o{ PROJECT : possui
    CONTRACT ||--o{ CONTRACT_ITEM : contem
    SERVICE ||--o{ CONTRACT_ITEM : "vendido em"
    CONTRACT ||--o{ PROJECT : gera

    AUTH_USERS {
        uuid id PK
        text email
    }
    PROFILE {
        uuid id PK_FK
        text full_name
        text email
        user_role role
        boolean active
    }
    EMPLOYEE {
        uuid id PK
        uuid profile_id FK
        date admission_date
        boolean active
        timestamptz deleted_at
    }
    CLIENT {
        uuid id PK
        text legal_name
        text trade_name
        text document
        boolean active
        timestamptz deleted_at
    }
    CLIENT_CONTACT {
        uuid id PK
        uuid client_id FK
        text full_name
        text email
        boolean is_primary
        timestamptz deleted_at
    }
    SERVICE {
        uuid id PK
        text name
        service_line service_line
        service_billing_type billing_type
        bigint base_price_cents
        boolean active
        timestamptz deleted_at
    }
    CONTRACT {
        uuid id PK
        uuid client_id FK
        contract_status status
        signature_provider signature_provider
        date start_date
        date end_date
        timestamptz deleted_at
    }
    CONTRACT_ITEM {
        uuid id PK
        uuid contract_id FK
        uuid service_id FK
        integer quantity
        bigint unit_price_cents
        service_billing_type billing_type
    }
    PROJECT {
        uuid id PK
        uuid client_id FK
        uuid contract_id FK
        text name
        project_status status
        timestamptz deleted_at
    }
    AUDIT_LOG {
        uuid id PK
        uuid actor_profile_id FK
        text action
        text entity_type
        uuid entity_id
        jsonb metadata
    }
```

## Tabelas

### `profile`
Conta de acesso ao sistema, ligada 1:1 ao `auth.users` do Supabase Auth.
Guarda o perfil (`role`): `socio`, `financeiro`, `gestor`, `colaborador`,
`freelancer`, `cliente`. No MVP da Onda 1 só os quatro primeiros perfis têm
linha em `profile` (freelancer e cliente chegam nas Ondas 2 e 3).

### `employee`
Registro de colaborador/sócio, separado de `profile` para não precisar
redesenhar quando o módulo de RH (Onda 2) trouxer custo/hora, ausências,
metas etc. Por ora só tem `admission_date` e `active`; os demais dados
ficam com o `profile` (nome, e-mail) via join por `profile_id`.

### `client` / `client_contact`
Cadastro de cliente e seus contatos. `document` (CNPJ/CPF) é único.

### `service`
Catálogo de serviços. `service_line` reflete as 3 linhas de negócio da
Elumina (`social_media`, `audiovisual`, `marketplace`). `billing_type`
distingue serviço recorrente mensal de serviço pontual. Playbook/checklist
detalhado do serviço é da Etapa do módulo 2 (Catálogo e playbooks), não
desta etapa.

### `contract` / `contract_item`
Um contrato pode ter vários serviços (`contract_item`), cada um com preço e
tipo de cobrança próprios — o preço é copiado do serviço no momento da
venda (não referencia `service.base_price_cents` diretamente), para não
mudar o valor de contratos antigos se o preço do catálogo for reajustado
depois. Campos de assinatura digital (`signature_provider`,
`signature_status`, `external_signature_id`, `signed_at`) já preparados
para a integração (Clicksign ou ZapSign — decisão pendente em
`docs/backlog.md`).

### `project`
Nasce do handoff automático quando o contrato é assinado. Ainda sem tarefas
(`task`) ou registro de tempo (`time_entry`) — isso é do módulo 5, Onda 2.

### `audit_log`
Log imutável (sem soft delete, sem policy de update/delete) para ações
sensíveis, conforme regra de arquitetura do `CLAUDE.md`. A aplicação decide
quando gravar uma entrada; esta etapa só cria a tabela e as políticas.

## Regras aplicadas

- Todo valor monetário em centavos (`bigint`), nunca float.
- `id uuid`, `created_at`, `updated_at` em toda tabela; `deleted_at` (soft
  delete) onde há histórico relevante (`client`, `client_contact`,
  `service`, `contract`, `project`, `employee`). `contract_item` e
  `audit_log` não têm soft delete: item de contrato segue o contrato
  (cascade), e log é imutável.
- RLS habilitado em todas as tabelas da Fundação, com uma função auxiliar
  `auth_role()` (security definer) que lê o perfil do usuário autenticado.

## Simplificações conhecidas (RLS)

- `colaborador` hoje vê todos os clientes e projetos (leitura), não só os
  que está alocado — porque a alocação em projeto (quem faz parte de qual
  projeto) só é modelada no módulo de Tarefas (Onda 2). Ajustar a policy
  quando esse módulo existir. Registrado em `docs/backlog.md`.
- Testado localmente sem um Supabase real: `auth.users` e `auth.uid()`
  foram simulados. O teste completo de RLS com usuários de perfis
  diferentes só é possível a partir da Etapa 0.4 (scaffold com projeto
  Supabase de fato).

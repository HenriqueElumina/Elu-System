# Migrations

Convenção do Supabase CLI: `supabase/migrations/<timestamp>_descricao.sql`,
aplicadas em ordem crescente pelo timestamp.

- `20260919120000_foundation_schema.sql` — Etapa 0.3: schema da Fundação
  (perfis, clientes, serviços, contratos, projetos, colaboradores, log de
  auditoria) com RLS. Depende do `auth.users` do Supabase Auth.

Testado localmente com PostgreSQL 16 (aplicar + reverter limpo) antes de
comitar — ver `docs/01-modelo-de-dados.md` para o ERD e a descrição de cada
tabela.

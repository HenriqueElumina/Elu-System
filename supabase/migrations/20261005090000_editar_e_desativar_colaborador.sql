-- Onda 2, Etapa 9.3 — Editar e desativar colaborador.
--
-- "Excluir" de verdade (apagar o login) exigiria a API admin do
-- Supabase, que precisa da service_role key -- nunca usada neste
-- projeto (ignora toda a RLS). O que dá: desativar. auth_role() passa a
-- exigir profile.active = true -- perfil desativado não tem role
-- nenhum pra fins de permissão, o que barra automaticamente todo o
-- sistema pra essa pessoa (um lugar só pra mudar, em vez de tocar em
-- cada policy). Sem tabela nova -- employee.active, employee.role_title,
-- employee_compensation.hourly_cost_cents e profile.active já existem.

create or replace function auth_role()
returns user_role
language sql
security definer
stable
as $$
  select role from profile where id = auth.uid() and active = true;
$$;

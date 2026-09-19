-- Etapa 0.4 (scaffold): cria profile automaticamente quando um usuário
-- nasce no Supabase Auth, e concede os grants que o Data API precisa --
-- porque o projeto foi criado com "Automatically expose new tables"
-- desligado (controle manual de acesso, por decisão do dono do produto).

-- ---------------------------------------------------------------------------
-- Trigger: auth.users -> profile
-- ---------------------------------------------------------------------------

create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role;
begin
  begin
    v_role := coalesce(new.raw_user_meta_data->>'role', 'colaborador')::user_role;
  exception when invalid_text_representation then
    v_role := 'colaborador';
  end;

  insert into profile (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    v_role
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Grants para o papel "authenticated" (Data API / PostgREST).
-- RLS continua sendo a proteção linha-a-linha; isto só libera a tabela
-- para o Data API conversar com o Postgres. Nenhum grant para "anon":
-- tudo no app exige login.
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  profile,
  employee,
  client,
  client_contact,
  service,
  contract,
  contract_item,
  project,
  audit_log
to authenticated;

grant execute on function auth_role() to authenticated;

-- Etapa "Editar dados do projeto": hoje o projeto só nasce automático
-- (Etapa 1.6) e nunca teve edição de nome/datas -- só status, na lista
-- /projetos (Etapa "Projetos agrupados"). end_date não existia; sem ela
-- não dava pra registrar quando o projeto deveria encerrar (mesmo padrão
-- que contract.end_date já tem desde a Etapa 1.7).
alter table project add column end_date date;

-- Sem mudança de RLS: project_write (Etapa 0.3) já libera update livre de
-- qualquer coluna pra socio/gestor.

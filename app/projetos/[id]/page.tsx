import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_LABELS } from "@/lib/validation/project";
import { TASK_STATUS_LABELS } from "@/lib/validation/task";
import { TaskStatusActions } from "./task-status-actions";

export default async function ProjetoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profile")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["socio", "gestor", "colaborador"].includes(profile.role)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
      </main>
    );
  }

  const { data: project } = await supabase
    .from("project")
    .select("id, name, status, start_date, client:client_id(id, legal_name)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!project) notFound();

  const { data: tasks } = await supabase
    .from("task")
    .select("id, title, description, status, due_date")
    .eq("project_id", project.id)
    .is("deleted_at", null)
    .order("created_at");

  const client = project.client as unknown as {
    id: string;
    legal_name: string;
  } | null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/projetos" className="text-sm text-gray-500 hover:underline">
        ← Voltar
      </Link>
      <h1 className="mb-2 mt-2 text-xl font-semibold">{project.name}</h1>
      <p className="mb-8 text-sm text-gray-600">
        {client && (
          <Link href={`/clientes/${client.id}`} className="hover:underline">
            {client.legal_name}
          </Link>
        )}
        {" — "}
        {PROJECT_STATUS_LABELS[project.status] ?? project.status}
      </p>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Tarefas</h2>

        {(!tasks || tasks.length === 0) && (
          <p className="text-sm text-gray-500">
            Nenhuma tarefa ainda — nasce sozinha do playbook do serviço quando
            o contrato é assinado.
          </p>
        )}

        {tasks && tasks.length > 0 && (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-start justify-between gap-4 rounded-md border border-gray-200 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-gray-600">{task.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {TASK_STATUS_LABELS[task.status] ?? task.status}
                    {task.due_date &&
                      ` — prazo ${new Date(task.due_date).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
                <TaskStatusActions
                  taskId={task.id}
                  projectId={project.id}
                  status={task.status}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

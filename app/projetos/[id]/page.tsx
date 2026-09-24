import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { PROJECT_STATUS_LABELS } from "@/lib/validation/project";
import { TASK_STATUS_LABELS } from "@/lib/validation/task";
import { formatRelativeTime } from "@/lib/format/relative-time";
import { TaskStatusActions } from "./task-status-actions";
import { TaskAssignmentEditor } from "./task-assignment-editor";
import { TimeEntryForm } from "./time-entry-form";
import { DeleteTimeEntryButton } from "./delete-time-entry-button";
import { NewTaskForm } from "./new-task-form";
import { DuplicateTaskButton } from "./duplicate-task-button";
import { EditTaskForm } from "./edit-task-form";
import { sumLoggedHours } from "@/lib/tasks/time";

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
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || !["socio", "gestor", "colaborador"].includes(profile.role)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
      </main>
    );
  }

  const canManage = profile.role === "socio" || profile.role === "gestor";

  const { data: project } = await supabase
    .from("project")
    .select("id, name, status, start_date, client:client_id(id, legal_name)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!project) notFound();

  const { data: tasks } = await supabase
    .from("task")
    .select(
      "id, title, description, status, due_date, updated_at, estimated_hours, assigned_to, assignee:assigned_to(full_name)",
    )
    .eq("project_id", project.id)
    .is("deleted_at", null)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at");

  const taskIds = (tasks ?? []).map((task) => task.id);

  const [{ data: history }, { data: assignees }, { data: timeEntries }] = await Promise.all([
    taskIds.length > 0
      ? supabase
          .from("task_status_history")
          .select("task_id, from_status, to_status, changed_at, changer:changed_by(full_name)")
          .in("task_id", taskIds)
          .order("changed_at")
      : Promise.resolve({ data: [] }),
    canManage
      ? supabase
          .from("profile")
          .select("id, full_name")
          .in("role", ["socio", "gestor", "colaborador"])
          .eq("active", true)
          .order("full_name")
      : Promise.resolve({ data: null }),
    taskIds.length > 0
      ? supabase
          .from("time_entry")
          .select("id, task_id, work_date, hours, note, logger:profile_id(full_name)")
          .in("task_id", taskIds)
          .is("deleted_at", null)
          .order("work_date")
      : Promise.resolve({ data: [] }),
  ]);

  const client = project.client as unknown as {
    id: string;
    legal_name: string;
  } | null;

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-10">
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
        {PROJECT_STATUS_LABELS[
          project.status as keyof typeof PROJECT_STATUS_LABELS
        ] ?? project.status}
      </p>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Tarefas</h2>
          {canManage && <NewTaskForm projectId={project.id} />}
        </div>

        {(!tasks || tasks.length === 0) && (
          <p className="text-sm text-gray-500">
            Nenhuma tarefa ainda — nasce sozinha do playbook do serviço quando
            o contrato é assinado, ou crie uma manualmente acima.
          </p>
        )}

        {tasks && tasks.length > 0 && (
          <ul className="space-y-3">
            {tasks.map((task) => {
              const assignee = task.assignee as unknown as {
                full_name: string;
              } | null;
              const canAct = canManage || task.assigned_to === user.id;
              const taskHistory = (history ?? []).filter(
                (entry) => entry.task_id === task.id,
              );
              const taskTimeEntries = (timeEntries ?? []).filter(
                (entry) => entry.task_id === task.id,
              );
              const loggedHours = sumLoggedHours(taskTimeEntries);

              return (
                <li
                  key={task.id}
                  className="rounded-md border border-gray-200 p-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-gray-600">{task.description}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {TASK_STATUS_LABELS[task.status] ?? task.status}
                        {task.due_date &&
                          ` — prazo ${new Date(task.due_date).toLocaleDateString("pt-BR")}`}
                        {task.estimated_hours != null && ` — estimativa ${task.estimated_hours}h`}
                        {loggedHours > 0 && ` — lançado ${loggedHours}h`}
                        {" — "}
                        atualizado {formatRelativeTime(new Date(task.updated_at))}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Responsável: {assignee?.full_name ?? "sem responsável"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {canAct && (
                        <TaskStatusActions
                          taskId={task.id}
                          projectId={project.id}
                          status={task.status}
                        />
                      )}
                      {canManage && (
                        <DuplicateTaskButton taskId={task.id} projectId={project.id} />
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <EditTaskForm
                      taskId={task.id}
                      projectId={project.id}
                      title={task.title}
                      description={task.description}
                      dueDate={task.due_date}
                    />
                  )}

                  {canManage && (
                    <TaskAssignmentEditor
                      taskId={task.id}
                      projectId={project.id}
                      assignedTo={task.assigned_to}
                      estimatedHours={task.estimated_hours}
                      assignees={assignees ?? []}
                    />
                  )}

                  {canAct && (
                    <TimeEntryForm taskId={task.id} projectId={project.id} />
                  )}

                  {taskTimeEntries.length > 0 && (
                    <details className="mt-2 text-xs text-gray-500">
                      <summary className="cursor-pointer">
                        Lançamentos de tempo ({loggedHours}h)
                      </summary>
                      <ul className="mt-1 space-y-1">
                        {taskTimeEntries.map((entry) => {
                          const logger = entry.logger as unknown as {
                            full_name: string;
                          } | null;
                          return (
                            <li key={entry.id}>
                              {new Date(entry.work_date).toLocaleDateString("pt-BR")} —{" "}
                              {entry.hours}h por {logger?.full_name ?? "-"}
                              {entry.note && ` — ${entry.note}`}
                              {canManage && (
                                <>
                                  {" "}
                                  (
                                  <DeleteTimeEntryButton
                                    timeEntryId={entry.id}
                                    projectId={project.id}
                                  />
                                  )
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  )}

                  {taskHistory.length > 0 && (
                    <details className="mt-2 text-xs text-gray-500">
                      <summary className="cursor-pointer">Histórico</summary>
                      <ul className="mt-1 space-y-1">
                        {taskHistory.map((entry, index) => {
                          const changer = entry.changer as unknown as {
                            full_name: string;
                          } | null;
                          return (
                            <li key={index}>
                              {TASK_STATUS_LABELS[entry.from_status ?? ""] ?? "início"} →{" "}
                              {TASK_STATUS_LABELS[entry.to_status] ?? entry.to_status} por{" "}
                              {changer?.full_name ?? "sistema"} em{" "}
                              {new Date(entry.changed_at).toLocaleString("pt-BR")}
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      </div>
    </AppShell>
  );
}

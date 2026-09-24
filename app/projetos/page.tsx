import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import {
  PROJECT_STATUS_LABELS,
  type PROJECT_STATUSES,
} from "@/lib/validation/project";
import { StatusSelect } from "./status-select";
import { DeleteProjectButton } from "./delete-project-button";

type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// Agrupamento visual por estágio (mesmo padrão da ADR 0023/0024 pra
// Contratos). "Arquivados" usa o próprio status — ver ADR 0026.
const STATUS_GROUPS: readonly {
  label: string;
  statuses: readonly ProjectStatus[];
  allowDelete?: boolean;
}[] = [
  { label: "Onboarding", statuses: ["planning"] },
  { label: "Vigente", statuses: ["active"] },
  { label: "Arquivados", statuses: ["completed", "cancelled"], allowDelete: true },
];

export default async function ProjetosPage() {
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

  const { data: projects, error } = await supabase
    .from("project")
    .select("id, name, status, start_date, client:client_id(id, legal_name)")
    .is("deleted_at", null)
    .order("start_date", { ascending: false });

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Projetos</h1>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Erro ao carregar projetos: {error.message}
        </p>
      )}

      {!error && projects?.length === 0 && (
        <p className="text-sm text-gray-500">
          Nenhum projeto ainda — um projeto nasce automaticamente quando um
          contrato é assinado.
        </p>
      )}

      {!error && projects && projects.length > 0 && (
        <div className="space-y-10">
          {STATUS_GROUPS.map((group) => {
            const groupProjects = projects.filter((project) =>
              (group.statuses as readonly string[]).includes(project.status),
            );

            return (
              <section key={group.label}>
                <h2 className="mb-3 text-sm font-semibold text-gray-700">
                  {group.label}{" "}
                  <span className="font-normal text-gray-400">
                    ({groupProjects.length})
                  </span>
                </h2>

                {groupProjects.length === 0 && (
                  <p className="text-sm text-gray-400">Nenhum</p>
                )}

                {groupProjects.length > 0 && (
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="py-2 pr-4">Nome</th>
                        <th className="py-2 pr-4">Cliente</th>
                        <th className="py-2 pr-4">Início</th>
                        <th className="py-2 pr-4">Status</th>
                        {canManage && group.allowDelete && (
                          <th className="py-2"></th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {groupProjects.map((project) => {
                        const client = project.client as unknown as {
                          id: string;
                          legal_name: string;
                        } | null;
                        return (
                          <tr key={project.id} className="border-b border-gray-100">
                            <td className="py-2 pr-4">
                              <Link
                                href={`/projetos/${project.id}`}
                                className="text-gray-900 underline-offset-2 hover:underline"
                              >
                                {project.name}
                              </Link>
                            </td>
                            <td className="py-2 pr-4">
                              {client ? (
                                <Link
                                  href={`/clientes/${client.id}`}
                                  className="text-gray-900 underline-offset-2 hover:underline"
                                >
                                  {client.legal_name}
                                </Link>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="py-2 pr-4">
                              {project.start_date
                                ? new Date(project.start_date).toLocaleDateString("pt-BR")
                                : "-"}
                            </td>
                            <td className="py-2 pr-4">
                              {canManage ? (
                                <StatusSelect
                                  projectId={project.id}
                                  currentStatus={project.status as ProjectStatus}
                                />
                              ) : (
                                PROJECT_STATUS_LABELS[
                                  project.status as keyof typeof PROJECT_STATUS_LABELS
                                ] ?? project.status
                              )}
                            </td>
                            {canManage && group.allowDelete && (
                              <td className="py-2">
                                <DeleteProjectButton projectId={project.id} />
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </section>
            );
          })}
        </div>
      )}
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_LABELS } from "@/lib/validation/project";

export default async function ProjetosPage() {
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

  const { data: projects, error } = await supabase
    .from("project")
    .select("id, name, status, start_date, client:client_id(id, legal_name)")
    .is("deleted_at", null)
    .order("start_date", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Projetos</h1>
        <Link href="/contratos" className="text-sm text-gray-500 hover:underline">
          ← Contratos
        </Link>
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
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-4">Nome</th>
              <th className="py-2 pr-4">Cliente</th>
              <th className="py-2 pr-4">Início</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const client = project.client as unknown as {
                id: string;
                legal_name: string;
              } | null;
              return (
                <tr key={project.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{project.name}</td>
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
                  <td className="py-2">
                    {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}

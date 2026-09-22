import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { centsToReais } from "@/lib/validation/service";
import { EditEmployeeForm } from "./edit-employee-form";
import { DeactivateEmployeeButton } from "./deactivate-employee-button";

export default async function ColaboradoresPage() {
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

  if (
    !profile ||
    !["socio", "financeiro", "gestor", "colaborador"].includes(profile.role)
  ) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
      </main>
    );
  }

  const canSeeCost = profile.role === "socio" || profile.role === "financeiro";
  const canInvite = canSeeCost;
  const canEditRole = profile.role === "socio";
  const canDeactivate = profile.role === "socio";
  const canManageRow = canEditRole || canSeeCost || canDeactivate;

  const { data: employees, error } = await supabase
    .from("employee")
    .select(
      "id, role_title, admission_date, active, profile:profile_id(full_name, email), compensation:employee_compensation(hourly_cost_cents)",
    )
    .is("deleted_at", null)
    .order("admission_date", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Colaboradores</h1>
        {canInvite && (
          <Link
            href="/colaboradores/convidar"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Convidar colaborador
          </Link>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Erro ao carregar colaboradores: {error.message}
        </p>
      )}

      {!error && employees?.length === 0 && (
        <p className="text-sm text-gray-500">Nenhum colaborador ainda.</p>
      )}

      {!error && employees && employees.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-4">Nome</th>
              <th className="py-2 pr-4">Cargo</th>
              <th className="py-2 pr-4">Admissão</th>
              <th className="py-2 pr-4">Status</th>
              {canSeeCost && <th className="py-2 pr-4">Custo/hora</th>}
              {canManageRow && <th className="py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => {
              const empProfile = employee.profile as unknown as {
                full_name: string;
                email: string;
              } | null;
              const compensation = employee.compensation as unknown as {
                hourly_cost_cents: number | null;
              } | null;
              return (
                <tr key={employee.id} className="border-b border-gray-100 align-top">
                  <td className="py-2 pr-4">
                    {empProfile?.full_name ?? "-"}
                  </td>
                  <td className="py-2 pr-4">{employee.role_title ?? "-"}</td>
                  <td className="py-2 pr-4">
                    {employee.admission_date
                      ? new Date(employee.admission_date).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>
                  <td className="py-2 pr-4">{employee.active ? "Ativo" : "Inativo"}</td>
                  {canSeeCost && (
                    <td className="py-2 pr-4">
                      {compensation?.hourly_cost_cents != null
                        ? centsToReais(compensation.hourly_cost_cents).toLocaleString(
                            "pt-BR",
                            { style: "currency", currency: "BRL" },
                          )
                        : "-"}
                    </td>
                  )}
                  {canManageRow && (
                    <td className="space-y-1 py-2">
                      <div className="flex gap-1">
                        <EditEmployeeForm
                          employeeId={employee.id}
                          roleTitle={employee.role_title}
                          hourlyCostReais={
                            compensation?.hourly_cost_cents != null
                              ? centsToReais(compensation.hourly_cost_cents)
                              : null
                          }
                          canEditRole={canEditRole}
                          canEditCost={canSeeCost}
                        />
                        {canDeactivate && (
                          <DeactivateEmployeeButton
                            employeeId={employee.id}
                            active={employee.active}
                          />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}

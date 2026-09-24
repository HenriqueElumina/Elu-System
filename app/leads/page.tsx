import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/validation/lead";

export default async function LeadsPage() {
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

  const canManage = profile?.role === "socio" || profile?.role === "gestor";

  if (!profile || !["socio", "financeiro", "gestor"].includes(profile.role)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
      </main>
    );
  }

  const { data: leads, error } = await supabase
    .from("lead")
    .select("id, company_name, contact_name, status")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Comercial — Leads</h1>
        {canManage && (
          <Link
            href="/leads/novo"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Novo lead
          </Link>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Erro ao carregar leads: {error.message}
        </p>
      )}

      {!error && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LEAD_STATUSES.map((status) => (
            <div key={status}>
              <h2 className="mb-2 text-sm font-semibold text-gray-700">
                {LEAD_STATUS_LABELS[status]}
              </h2>
              <ul className="space-y-2">
                {(leads ?? [])
                  .filter((lead) => lead.status === status)
                  .map((lead) => (
                    <li
                      key={lead.id}
                      className="rounded-md border border-gray-200 p-3 text-sm"
                    >
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {lead.company_name}
                      </Link>
                      {lead.contact_name && (
                        <p className="text-gray-500">{lead.contact_name}</p>
                      )}
                    </li>
                  ))}
                {(leads ?? []).filter((lead) => lead.status === status)
                  .length === 0 && (
                  <li className="text-sm text-gray-400">Nenhum</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
      </div>
    </AppShell>
  );
}

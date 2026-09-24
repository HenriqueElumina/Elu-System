import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/validation/lead";
import {
  LEAD_DAY_FILTERS,
  createdAfterCutoff,
  parseLeadDayFilter,
} from "@/lib/leads/date-filter";
import { ArchiveLeadButton } from "./archive-lead-button";
import { DeleteLeadButton } from "./delete-lead-button";

function formatCreatedAt(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; ver?: string }>;
}) {
  const { days: daysParam, ver } = await searchParams;
  const days = parseLeadDayFilter(daysParam);
  const showArchived = ver === "arquivados";

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

  let query = supabase
    .from("lead")
    .select("id, company_name, contact_name, status, created_at, archived_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  query = showArchived
    ? query.not("archived_at", "is", null)
    : query.is("archived_at", null);

  const cutoff = createdAfterCutoff(days);
  if (cutoff) query = query.gte("created_at", cutoff);

  const { data: leads, error } = await query;

  const daysQuery = days ? `days=${days}` : "";
  const toggleHref = showArchived
    ? `/leads${daysQuery ? `?${daysQuery}` : ""}`
    : `/leads?ver=arquivados${daysQuery ? `&${daysQuery}` : ""}`;

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Comercial — {showArchived ? "Leads arquivados" : "Leads"}
          </h1>
          {canManage && !showArchived && (
            <Link
              href="/leads/novo"
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
            >
              + Novo lead
            </Link>
          )}
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <form className="flex items-center gap-2">
            {showArchived && <input type="hidden" name="ver" value="arquivados" />}
            <label htmlFor="days" className="text-gray-600">
              Cadastrados nos últimos
            </label>
            <select
              id="days"
              name="days"
              defaultValue={daysParam ?? ""}
              className="rounded-md border border-gray-300 px-2 py-1"
            >
              <option value="">Todo o período</option>
              {LEAD_DAY_FILTERS.map((d) => (
                <option key={d} value={d}>
                  {d} dias
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-1 font-medium"
            >
              Filtrar
            </button>
          </form>

          <Link href={toggleHref} className="text-gray-500 hover:underline">
            {showArchived ? "← Ver ativos" : "Ver arquivados →"}
          </Link>
        </div>

        {error && (
          <p className="text-sm text-red-600">
            Erro ao carregar leads: {error.message}
          </p>
        )}

        {!error && showArchived && (
          <>
            {(leads ?? []).length === 0 && (
              <p className="text-sm text-gray-500">Nenhum lead arquivado.</p>
            )}
            {(leads ?? []).length > 0 && (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-2 pr-4">Empresa</th>
                    <th className="py-2 pr-4">Estágio</th>
                    <th className="py-2 pr-4">Cadastrado em</th>
                    {canManage && <th className="py-2"></th>}
                  </tr>
                </thead>
                <tbody>
                  {(leads ?? []).map((lead) => (
                    <tr key={lead.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-gray-900 underline-offset-2 hover:underline"
                        >
                          {lead.company_name}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">
                        {LEAD_STATUS_LABELS[
                          lead.status as keyof typeof LEAD_STATUS_LABELS
                        ] ?? lead.status}
                      </td>
                      <td className="py-2 pr-4">
                        {formatCreatedAt(lead.created_at)}
                      </td>
                      {canManage && (
                        <td className="space-x-1 py-2">
                          <ArchiveLeadButton leadId={lead.id} archived />
                          <DeleteLeadButton leadId={lead.id} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {!error && !showArchived && (
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
                        <p className="mt-1 text-xs text-gray-400">
                          Cadastrado em {formatCreatedAt(lead.created_at)}
                        </p>
                        {canManage && (
                          <div className="mt-2 flex gap-1">
                            <ArchiveLeadButton leadId={lead.id} archived={false} />
                            <DeleteLeadButton leadId={lead.id} />
                          </div>
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

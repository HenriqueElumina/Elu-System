import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import {
  CONTENT_DEMAND_STATUSES,
  CONTENT_DEMAND_STATUS_LABELS,
  CONTENT_DEMAND_STATUS_ACCENTS,
  CONTENT_CHANNELS,
} from "@/lib/validation/content-demand";
import {
  parseWorkflowPeriodPreset,
  resolveWorkflowPeriod,
  sortByScheduledAt,
} from "@/lib/workflow/period-filter";
import { StatusSelect } from "./status-select";

const CHANNEL_LABELS = Object.fromEntries(
  CONTENT_CHANNELS.map((channel) => [channel.key, channel.label]),
);

function formatScheduledAt(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toQueryString(
  params: Record<string, string | string[] | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      value.forEach((v) => v && sp.append(key, v));
    } else {
      sp.set(key, value);
    }
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export default async function WorkflowPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    status?: string | string[];
    client?: string;
    assignee?: string;
    period?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const params = await searchParams;
  const view = params.view === "lista" ? "lista" : "painel";

  const selectedStatuses = toArray(params.status).filter((s) =>
    (CONTENT_DEMAND_STATUSES as readonly string[]).includes(s),
  ) as (typeof CONTENT_DEMAND_STATUSES)[number][];
  const statusFilter = selectedStatuses.length > 0 ? selectedStatuses : null;
  const visibleStatuses =
    selectedStatuses.length > 0
      ? CONTENT_DEMAND_STATUSES.filter((s) => selectedStatuses.includes(s))
      : CONTENT_DEMAND_STATUSES;

  const periodPreset = parseWorkflowPeriodPreset(params.period);
  const periodRange = resolveWorkflowPeriod(periodPreset, params.from, params.to);

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

  let demandsQuery = supabase
    .from("content_demand")
    .select(
      "id, title, status, channels, scheduled_at, assigned_to, client:client_id(legal_name), assignee:assigned_to(full_name)",
    )
    .is("deleted_at", null);

  if (statusFilter) demandsQuery = demandsQuery.in("status", statusFilter);
  if (params.client) demandsQuery = demandsQuery.eq("client_id", params.client);
  if (params.assignee)
    demandsQuery = demandsQuery.eq("assigned_to", params.assignee);
  if (periodRange) {
    demandsQuery = demandsQuery.or(
      `scheduled_at.is.null,and(scheduled_at.gte.${periodRange.from}T00:00:00,scheduled_at.lte.${periodRange.to}T23:59:59)`,
    );
  }
  demandsQuery = demandsQuery.order("created_at", { ascending: false });

  const [{ data: demands, error }, { data: clients }, { data: assignees }] =
    await Promise.all([
      demandsQuery,
      supabase
        .from("client")
        .select("id, legal_name")
        .is("deleted_at", null)
        .order("legal_name"),
      supabase
        .from("profile")
        .select("id, full_name")
        .in("role", ["socio", "gestor", "colaborador"])
        .eq("active", true)
        .order("full_name"),
    ]);

  const currentParams: Record<string, string | string[] | undefined> = {
    view: view === "lista" ? "lista" : undefined,
    status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    client: params.client || undefined,
    assignee: params.assignee || undefined,
    period: periodPreset ?? undefined,
    from: params.from || undefined,
    to: params.to || undefined,
  };

  function hrefWith(overrides: Record<string, string | string[] | undefined>) {
    return `/projetos/workflow${toQueryString({ ...currentParams, ...overrides })}`;
  }

  const hasActiveFilters =
    selectedStatuses.length > 0 ||
    Boolean(params.client) ||
    Boolean(params.assignee) ||
    periodPreset !== null;

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Workflow</h1>
          {canManage && (
            <Link
              href="/projetos/workflow/novo"
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
            >
              + Nova demanda
            </Link>
          )}
        </div>

        <div className="mb-6 flex gap-3 text-sm">
          <Link
            href={hrefWith({ view: undefined })}
            className={
              view === "painel"
                ? "font-semibold text-gray-900 underline underline-offset-4"
                : "text-gray-500 hover:underline"
            }
          >
            Painel
          </Link>
          <Link
            href={hrefWith({ view: "lista" })}
            className={
              view === "lista"
                ? "font-semibold text-gray-900 underline underline-offset-4"
                : "text-gray-500 hover:underline"
            }
          >
            Lista
          </Link>
        </div>

        <form className="mb-8 flex flex-wrap items-end gap-4 text-sm">
          {view === "lista" && <input type="hidden" name="view" value="lista" />}

          <div>
            <span className="mb-1 block text-gray-600">Situação</span>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {CONTENT_DEMAND_STATUSES.map((status) => (
                <label key={status} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    name="status"
                    value={status}
                    defaultChecked={
                      selectedStatuses.length === 0 ||
                      selectedStatuses.includes(status)
                    }
                  />
                  {CONTENT_DEMAND_STATUS_LABELS[status]}
                </label>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-gray-600">Cliente</span>
            <select
              name="client"
              defaultValue={params.client ?? ""}
              className="rounded-md border border-gray-300 px-2 py-1"
            >
              <option value="">Todos</option>
              {(clients ?? []).map((client) => (
                <option key={client.id} value={client.id}>
                  {client.legal_name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-gray-600">Responsável</span>
            <select
              name="assignee"
              defaultValue={params.assignee ?? ""}
              className="rounded-md border border-gray-300 px-2 py-1"
            >
              <option value="">Todos</option>
              {(assignees ?? []).map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-gray-600">Período</span>
            <select
              name="period"
              defaultValue={periodPreset ?? ""}
              className="rounded-md border border-gray-300 px-2 py-1"
            >
              <option value="">Todo o período</option>
              <option value="hoje">Hoje</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mês</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-gray-600">De</span>
            <input
              type="date"
              name="from"
              defaultValue={params.from ?? ""}
              className="rounded-md border border-gray-300 px-2 py-1"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-gray-600">Até</span>
            <input
              type="date"
              name="to"
              defaultValue={params.to ?? ""}
              className="rounded-md border border-gray-300 px-2 py-1"
            />
          </label>

          <button
            type="submit"
            className="rounded-md border border-gray-300 px-3 py-1 font-medium"
          >
            Filtrar
          </button>

          {hasActiveFilters && (
            <Link
              href={`/projetos/workflow${view === "lista" ? "?view=lista" : ""}`}
              className="text-gray-500 hover:underline"
            >
              Limpar filtros
            </Link>
          )}
        </form>

        {error && (
          <p className="text-sm text-red-600">
            Erro ao carregar demandas: {error.message}
          </p>
        )}

        {!error && view === "painel" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {visibleStatuses.map((status) => {
              const columnDemands = (demands ?? []).filter(
                (demand) => demand.status === status,
              );

              const accent = CONTENT_DEMAND_STATUS_ACCENTS[status];

              return (
                <div key={status}>
                  <div className={`mb-2 h-1 rounded-full ${accent.bar}`} />
                  <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${accent.dot}`}
                      aria-hidden
                    />
                    {CONTENT_DEMAND_STATUS_LABELS[status]}{" "}
                    <span className="font-normal text-gray-400">
                      ({columnDemands.length})
                    </span>
                  </h2>
                  <ul className="space-y-2">
                    {columnDemands.map((demand) => {
                      const client = demand.client as unknown as {
                        legal_name: string;
                      } | null;
                      const assignee = demand.assignee as unknown as {
                        full_name: string;
                      } | null;
                      const canAct =
                        canManage || demand.assigned_to === user.id;

                      return (
                        <li
                          key={demand.id}
                          className={`rounded-md border border-gray-200 border-l-4 p-3 text-sm ${accent.border}`}
                        >
                          <Link
                            href={`/projetos/workflow/${demand.id}`}
                            className="font-medium text-gray-900 underline-offset-2 hover:underline"
                          >
                            {demand.title}
                          </Link>
                          <p className="text-gray-500">
                            {client?.legal_name ?? "-"}
                          </p>
                          <p className="text-xs text-gray-400">
                            Responsável: {assignee?.full_name ?? "sem responsável"}
                          </p>
                          {demand.channels && demand.channels.length > 0 && (
                            <p className="mt-1 text-xs text-gray-400">
                              {demand.channels
                                .map((key: string) => CHANNEL_LABELS[key] ?? key)
                                .join(" · ")}
                            </p>
                          )}
                          {demand.scheduled_at && (
                            <p className="mt-1 text-xs text-gray-400">
                              {formatScheduledAt(demand.scheduled_at)}
                            </p>
                          )}
                          {canAct && (
                            <div className="mt-2">
                              <StatusSelect
                                demandId={demand.id}
                                currentStatus={demand.status}
                              />
                            </div>
                          )}
                        </li>
                      );
                    })}
                    {columnDemands.length === 0 && (
                      <li className="text-sm text-gray-400">Nenhuma</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {!error && view === "lista" && (
          <div>
            {visibleStatuses.map((status) => {
              const accent = CONTENT_DEMAND_STATUS_ACCENTS[status];
              const statusDemands = sortByScheduledAt(
                (demands ?? []).filter((demand) => demand.status === status),
              );

              return (
                <div key={status} className="mb-8">
                  <div className={`mb-2 h-1 rounded-full ${accent.bar}`} />
                  <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${accent.dot}`}
                      aria-hidden
                    />
                    {CONTENT_DEMAND_STATUS_LABELS[status]}{" "}
                    <span className="font-normal text-gray-400">
                      ({statusDemands.length})
                    </span>
                  </h2>

                  {statusDemands.length === 0 ? (
                    <p className="text-sm text-gray-400">Nenhuma</p>
                  ) : (
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-500">
                          <th className="py-2 pr-4">Demanda</th>
                          <th className="py-2 pr-4">Cliente</th>
                          <th className="py-2 pr-4">Responsável</th>
                          <th className="py-2 pr-4">Canais</th>
                          <th className="py-2">Publicação prevista</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statusDemands.map((demand) => {
                          const client = demand.client as unknown as {
                            legal_name: string;
                          } | null;
                          const assignee = demand.assignee as unknown as {
                            full_name: string;
                          } | null;

                          return (
                            <tr key={demand.id} className="border-b border-gray-100">
                              <td
                                className={`border-l-4 py-2 pl-2 pr-4 ${accent.border}`}
                              >
                                <Link
                                  href={`/projetos/workflow/${demand.id}`}
                                  className="font-medium text-gray-900 underline-offset-2 hover:underline"
                                >
                                  {demand.title}
                                </Link>
                              </td>
                              <td className="py-2 pr-4">
                                {client?.legal_name ?? "-"}
                              </td>
                              <td className="py-2 pr-4">
                                {assignee?.full_name ?? "sem responsável"}
                              </td>
                              <td className="py-2 pr-4">
                                {demand.channels && demand.channels.length > 0
                                  ? demand.channels
                                      .map((key: string) => CHANNEL_LABELS[key] ?? key)
                                      .join(" · ")
                                  : "-"}
                              </td>
                              <td className="py-2">
                                {demand.scheduled_at
                                  ? formatScheduledAt(demand.scheduled_at)
                                  : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

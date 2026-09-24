import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import {
  CONTENT_DEMAND_STATUSES,
  CONTENT_DEMAND_STATUS_LABELS,
  CONTENT_CHANNELS,
} from "@/lib/validation/content-demand";
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

export default async function WorkflowPage() {
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

  const { data: demands, error } = await supabase
    .from("content_demand")
    .select(
      "id, title, status, channels, scheduled_at, assigned_to, client:client_id(legal_name), assignee:assigned_to(full_name)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
        <div className="mb-8 flex items-center justify-between">
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

        {error && (
          <p className="text-sm text-red-600">
            Erro ao carregar demandas: {error.message}
          </p>
        )}

        {!error && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CONTENT_DEMAND_STATUSES.map((status) => {
              const columnDemands = (demands ?? []).filter(
                (demand) => demand.status === status,
              );

              return (
                <div key={status}>
                  <h2 className="mb-2 text-sm font-semibold text-gray-700">
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
                          className="rounded-md border border-gray-200 p-3 text-sm"
                        >
                          <p className="font-medium text-gray-900">
                            {demand.title}
                          </p>
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
      </div>
    </AppShell>
  );
}

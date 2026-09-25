import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { DemandCard } from "./demand-card";
import { channelsLabel, formatScheduledAt } from "./format";

export default async function PortalPage() {
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

  if (!profile || profile.role !== "cliente") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
      </main>
    );
  }

  // RLS (content_demand_select_cliente) já filtra pro próprio client_id e
  // status = 'awaiting_approval' -- não precisa repetir esses filtros
  // aqui. Só campos que fazem sentido pro cliente ver (sem briefing/tags/
  // responsável, que são informação interna).
  const { data: demands, error } = await supabase
    .from("content_demand")
    .select("id, title, channels, scheduled_at, caption, final_media_url")
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-10">
        <h1 className="mb-2 text-xl font-semibold">Aprovações</h1>
        <p className="mb-8 text-sm text-gray-500">
          Demandas de conteúdo aguardando sua aprovação.
        </p>

        {error && (
          <p className="text-sm text-red-600">
            Erro ao carregar demandas: {error.message}
          </p>
        )}

        {!error && (!demands || demands.length === 0) && (
          <p className="text-sm text-gray-500">
            Nenhuma demanda aguardando aprovação no momento.
          </p>
        )}

        {!error && demands && demands.length > 0 && (
          <ul className="space-y-4">
            {demands.map((demand) => (
              <DemandCard
                key={demand.id}
                demandId={demand.id}
                title={demand.title}
                channelsLabel={channelsLabel(demand.channels)}
                scheduledAtLabel={
                  demand.scheduled_at ? formatScheduledAt(demand.scheduled_at) : null
                }
                caption={demand.caption}
                finalMediaUrl={demand.final_media_url}
              />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

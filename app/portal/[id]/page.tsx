import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { DemandCard } from "../demand-card";
import { channelsLabel, formatScheduledAt } from "../format";

export default async function PortalDemandPage({
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

  if (!profile || profile.role !== "cliente") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
      </main>
    );
  }

  // RLS (content_demand_select_cliente) já garante que só vem de volta se
  // for do próprio client_id e ainda estiver aguardando aprovação -- sem
  // isso, é porque já foi decidida, não existe, ou é de outro cliente.
  const { data: demand } = await supabase
    .from("content_demand")
    .select("id, title, channels, scheduled_at, caption, final_media_url")
    .eq("id", id)
    .single();

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-10">
        <Link href="/portal" className="text-sm text-gray-500 hover:underline">
          ← Ver todas as aprovações
        </Link>
        <h1 className="mb-8 mt-2 text-xl font-semibold">Aprovação</h1>

        {!demand ? (
          <p className="text-sm text-gray-500">
            Essa demanda não está mais disponível pra aprovação — pode já ter
            sido decidida, ou o link não é válido.
          </p>
        ) : (
          <ul className="space-y-4">
            <DemandCard
              demandId={demand.id}
              title={demand.title}
              channelsLabel={channelsLabel(demand.channels)}
              scheduledAtLabel={
                demand.scheduled_at ? formatScheduledAt(demand.scheduled_at) : null
              }
              caption={demand.caption}
              finalMediaUrl={demand.final_media_url}
            />
          </ul>
        )}
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import {
  CONTENT_DEMAND_STATUS_LABELS,
  CONTENT_DEMAND_STATUS_ACCENTS,
  CONTENT_CHANNELS,
} from "@/lib/validation/content-demand";
import { StatusSelect } from "../status-select";
import { CaptionEditor } from "../caption-editor";
import { FinalMediaEditor } from "../final-media-editor";

const CHANNEL_LABELS = Object.fromEntries(
  CONTENT_CHANNELS.map((channel) => [channel.key, channel.label]),
);

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DemandaDetailPage({
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

  const { data: demand } = await supabase
    .from("content_demand")
    .select(
      "id, title, status, channels, scheduled_at, assigned_to, briefing, media_url, final_media_url, caption, tags, created_at, approved_at, client:client_id(legal_name), assignee:assigned_to(full_name), approver:approved_by(full_name)",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!demand) notFound();

  const client = demand.client as unknown as { legal_name: string } | null;
  const assignee = demand.assignee as unknown as { full_name: string } | null;
  const approver = demand.approver as unknown as { full_name: string } | null;
  const canAct = canManage || demand.assigned_to === user.id;

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-10">
        <Link
          href="/projetos/workflow"
          className="text-sm text-gray-500 hover:underline"
        >
          ← Voltar
        </Link>
        <h1 className="mb-6 mt-2 text-xl font-semibold">{demand.title}</h1>

        {canAct && (
          <div className="mb-6">
            <StatusSelect demandId={demand.id} currentStatus={demand.status} />
          </div>
        )}

        <dl className="space-y-3 text-sm">
          <Field label="Status">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  CONTENT_DEMAND_STATUS_ACCENTS[
                    demand.status as keyof typeof CONTENT_DEMAND_STATUS_ACCENTS
                  ]?.dot ?? "bg-gray-300"
                }`}
                aria-hidden
              />
              {CONTENT_DEMAND_STATUS_LABELS[
                demand.status as keyof typeof CONTENT_DEMAND_STATUS_LABELS
              ] ?? demand.status}
            </span>
          </Field>
          <Field label="Cliente">{client?.legal_name ?? "-"}</Field>
          <Field label="Responsável">
            {assignee?.full_name ?? "sem responsável"}
          </Field>
          <Field label="Canais">
            {demand.channels && demand.channels.length > 0
              ? demand.channels
                  .map((key: string) => CHANNEL_LABELS[key] ?? key)
                  .join(" · ")
              : "-"}
          </Field>
          <Field label="Data prevista para publicação">
            {demand.scheduled_at ? formatDateTime(demand.scheduled_at) : "-"}
          </Field>
          <Field label="Tags">
            {demand.tags && demand.tags.length > 0
              ? demand.tags.join(", ")
              : "-"}
          </Field>
          <Field label="Link do material bruto">
            {demand.media_url ? (
              <a
                href={demand.media_url}
                target="_blank"
                rel="noreferrer"
                className="text-gray-900 underline-offset-2 hover:underline"
              >
                {demand.media_url}
              </a>
            ) : (
              "-"
            )}
          </Field>
          <Field label="Link do material final">
            {canAct ? (
              <FinalMediaEditor
                demandId={demand.id}
                currentUrl={demand.final_media_url}
              />
            ) : (
              <p>{demand.final_media_url || "-"}</p>
            )}
          </Field>
          <Field label="Legenda">
            {canAct ? (
              <CaptionEditor demandId={demand.id} currentCaption={demand.caption} />
            ) : (
              <p className="whitespace-pre-wrap">{demand.caption || "-"}</p>
            )}
          </Field>
          <Field label="Briefing">
            {demand.briefing ? (
              <p className="whitespace-pre-wrap">{demand.briefing}</p>
            ) : (
              "-"
            )}
          </Field>
          {demand.approved_at && (
            <Field label="Aprovado">
              {formatDateTime(demand.approved_at)}
              {approver?.full_name && ` por ${approver.full_name}`}
            </Field>
          )}
          <Field label="Cadastrado em">{formatDateTime(demand.created_at)}</Field>
        </dl>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

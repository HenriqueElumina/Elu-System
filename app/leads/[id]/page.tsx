import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { centsToReais } from "@/lib/validation/service";
import { PROPOSAL_STATUS_LABELS } from "@/lib/validation/proposal";
import { EditarLeadClient } from "./editar-lead-client";
import { StatusChanger } from "./status-changer";
import { LinkClient } from "./link-client";

export default async function LeadDetailPage({
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

  if (!profile || !["socio", "financeiro", "gestor"].includes(profile.role)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
      </main>
    );
  }

  const { data: lead } = await supabase
    .from("lead")
    .select("*, client:client_id(id, legal_name)")
    .eq("id", id)
    .single();

  if (!lead) notFound();

  const canManage = profile.role === "socio" || profile.role === "gestor";

  const { data: availableClients } =
    canManage && !lead.client_id
      ? await supabase
          .from("client")
          .select("id, legal_name")
          .is("deleted_at", null)
          .order("legal_name")
      : { data: null };

  const { data: proposals } = await supabase
    .from("proposal")
    .select("id, status, notes, created_at, proposal_item(quantity, unit_price_cents)")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-10">
      <Link href="/leads" className="text-sm text-gray-500 hover:underline">
        ← Voltar
      </Link>
      <h1 className="mt-2 text-xl font-semibold">{lead.company_name}</h1>
      <p className="mb-6 text-xs text-gray-400">
        Cadastrado em{" "}
        {new Date(lead.created_at).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      {canManage && (
        <div className="mb-4">
          <StatusChanger
            leadId={lead.id}
            currentStatus={lead.status}
            currentLostReason={lead.lost_reason}
          />
        </div>
      )}

      <div className="mb-8">
        {lead.client ? (
          <p className="text-sm text-gray-600">
            Cliente vinculado:{" "}
            <Link
              href={`/clientes/${lead.client.id}`}
              className="font-medium text-gray-900 hover:underline"
            >
              {lead.client.legal_name}
            </Link>
          </p>
        ) : (
          canManage && (
            <LinkClient leadId={lead.id} clients={availableClients ?? []} />
          )
        )}
      </div>

      <section className="mb-10">
        {canManage ? (
          <EditarLeadClient
            leadId={lead.id}
            defaultValues={{
              companyName: lead.company_name,
              contactName: lead.contact_name ?? "",
              contactEmail: lead.contact_email ?? "",
              contactPhone: lead.contact_phone ?? "",
            }}
          />
        ) : (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Contato</dt>
              <dd>{lead.contact_name || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">E-mail</dt>
              <dd>{lead.contact_email || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Telefone</dt>
              <dd>{lead.contact_phone || "-"}</dd>
            </div>
          </dl>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Propostas</h2>
          {canManage && (
            <Link
              href={`/leads/${lead.id}/propostas/novo`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              + Nova proposta
            </Link>
          )}
        </div>

        {(!proposals || proposals.length === 0) && (
          <p className="text-sm text-gray-500">Nenhuma proposta ainda.</p>
        )}

        {proposals && proposals.length > 0 && (
          <ul className="space-y-2">
            {proposals.map((proposal) => {
              const total = (proposal.proposal_item ?? []).reduce(
                (sum, item) => sum + item.quantity * item.unit_price_cents,
                0,
              );
              return (
                <li
                  key={proposal.id}
                  className="rounded-md border border-gray-200 p-3 text-sm"
                >
                  <Link
                    href={`/leads/${lead.id}/propostas/${proposal.id}`}
                    className="font-medium text-gray-900 hover:underline"
                  >
                    {centsToReais(total).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </Link>
                  <span className="ml-2 text-gray-500">
                    {PROPOSAL_STATUS_LABELS[
                      proposal.status as keyof typeof PROPOSAL_STATUS_LABELS
                    ] ?? proposal.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      </div>
    </AppShell>
  );
}

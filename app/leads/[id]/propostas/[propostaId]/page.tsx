import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { centsToReais } from "@/lib/validation/service";
import { EditarPropostaClient } from "./editar-proposta-client";
import { PropostaStatusChanger } from "./proposta-status-changer";

export default async function PropostaDetailPage({
  params,
}: {
  params: Promise<{ id: string; propostaId: string }>;
}) {
  const { id: leadId, propostaId } = await params;
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

  if (!profile || !["socio", "financeiro", "gestor"].includes(profile.role)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
      </main>
    );
  }

  const { data: proposal } = await supabase
    .from("proposal")
    .select("id, status, notes, proposal_item(id, service_id, quantity, unit_price_cents)")
    .eq("id", propostaId)
    .single();

  if (!proposal) notFound();

  const canManage = profile.role === "socio" || profile.role === "gestor";

  const { data: services } = await supabase
    .from("service")
    .select("id, name, base_price_cents")
    .order("name");

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href={`/leads/${leadId}`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← Voltar pro lead
      </Link>
      <h1 className="mb-6 mt-2 text-xl font-semibold">Proposta</h1>

      {canManage && (
        <div className="mb-8">
          <PropostaStatusChanger
            leadId={leadId}
            proposalId={proposal.id}
            currentStatus={proposal.status}
          />
        </div>
      )}

      {canManage ? (
        <EditarPropostaClient
          leadId={leadId}
          proposalId={proposal.id}
          services={services ?? []}
          defaultValues={{
            notes: proposal.notes ?? "",
            items: (proposal.proposal_item ?? []).map((item) => ({
              serviceId: item.service_id,
              quantity: item.quantity,
              unitPriceReais: centsToReais(item.unit_price_cents),
            })),
          }}
        />
      ) : (
        <ul className="space-y-2 text-sm">
          {(proposal.proposal_item ?? []).map((item) => {
            const service = (services ?? []).find(
              (s) => s.id === item.service_id,
            );
            return (
              <li key={item.id}>
                {service?.name ?? "Serviço"} — {item.quantity}x{" "}
                {centsToReais(item.unit_price_cents).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { centsToReais } from "@/lib/validation/service";
import { ContratoStatusChanger } from "./contrato-status-changer";

export default async function ContratoDetailPage({
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

  const { data: contract } = await supabase
    .from("contract")
    .select(
      "id, status, start_date, end_date, client:client_id(id, legal_name), contract_item(id, quantity, unit_price_cents, service:service_id(name))",
    )
    .eq("id", id)
    .single();

  if (!contract) notFound();

  const canManage = profile.role === "socio" || profile.role === "gestor";
  const client = contract.client as unknown as {
    id: string;
    legal_name: string;
  } | null;
  const items = contract.contract_item ?? [];
  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price_cents,
    0,
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/contratos" className="text-sm text-gray-500 hover:underline">
        ← Voltar
      </Link>
      <h1 className="mb-6 mt-2 text-xl font-semibold">
        Contrato —{" "}
        {client ? (
          <Link href={`/clientes/${client.id}`} className="hover:underline">
            {client.legal_name}
          </Link>
        ) : (
          "-"
        )}
      </h1>

      {canManage && (
        <div className="mb-8">
          <ContratoStatusChanger
            contractId={contract.id}
            currentStatus={contract.status}
          />
        </div>
      )}

      <dl className="mb-8 space-y-2 text-sm">
        <div>
          <dt className="text-gray-500">Início</dt>
          <dd>{new Date(contract.start_date).toLocaleDateString("pt-BR")}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Fim</dt>
          <dd>
            {contract.end_date
              ? new Date(contract.end_date).toLocaleDateString("pt-BR")
              : "-"}
          </dd>
        </div>
      </dl>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Itens</h2>
        <ul className="space-y-1 text-sm">
          {items.map((item) => {
            const service = item.service as unknown as { name: string } | null;
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
        <p className="mt-3 text-sm font-medium">
          Total:{" "}
          {centsToReais(total).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </p>
      </section>
    </main>
  );
}

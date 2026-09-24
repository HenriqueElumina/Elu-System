import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { CONTRACT_STATUS_LABELS } from "@/lib/validation/contract";
import { centsToReais } from "@/lib/validation/service";

export default async function ContratosPage() {
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

  const { data: contracts, error } = await supabase
    .from("contract")
    .select(
      "id, status, start_date, client:client_id(legal_name), contract_item(quantity, unit_price_cents)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Contratos</h1>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Erro ao carregar contratos: {error.message}
        </p>
      )}

      {!error && contracts?.length === 0 && (
        <p className="text-sm text-gray-500">
          Nenhum contrato ainda — gere um a partir de uma proposta aceita.
        </p>
      )}

      {!error && contracts && contracts.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-4">Cliente</th>
              <th className="py-2 pr-4">Início</th>
              <th className="py-2 pr-4">Valor</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => {
              const total = (contract.contract_item ?? []).reduce(
                (sum, item) => sum + item.quantity * item.unit_price_cents,
                0,
              );
              const client = contract.client as unknown as {
                legal_name: string;
              } | null;
              return (
                <tr key={contract.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">
                    <Link
                      href={`/contratos/${contract.id}`}
                      className="text-gray-900 underline-offset-2 hover:underline"
                    >
                      {client?.legal_name ?? "-"}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">
                    {new Date(contract.start_date).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-2 pr-4">
                    {centsToReais(total).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="py-2">
                    {CONTRACT_STATUS_LABELS[
                      contract.status as keyof typeof CONTRACT_STATUS_LABELS
                    ] ?? contract.status}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      </div>
    </AppShell>
  );
}

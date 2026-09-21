import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { centsToReais } from "@/lib/validation/service";
import { computeReceivableSummary } from "@/lib/billing/receivable";

function formatCents(cents: number) {
  return centsToReais(cents).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function FinanceiroPage() {
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

  const { data: rows, error } = await supabase
    .from("contract_receivable_summary")
    .select(
      "contract_id, client_name, installment_amount_cents, total_installments, paid_installments",
    )
    .order("client_name");

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Financeiro — Contas a receber</h1>
        <div className="flex gap-3 text-sm text-gray-500">
          <Link href="/contratos" className="hover:underline">
            ← Contratos
          </Link>
          <Link href="/financeiro/contas-a-pagar" className="hover:underline">
            Contas a pagar →
          </Link>
          <Link href="/financeiro/fluxo-de-caixa" className="hover:underline">
            Fluxo de caixa →
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Erro ao carregar contas a receber: {error.message}
        </p>
      )}

      {!error && rows?.length === 0 && (
        <p className="text-sm text-gray-500">
          Nenhuma cobrança recorrente ainda — nasce sozinha quando um
          contrato com item de cobrança mensal é assinado.
        </p>
      )}

      {!error && rows && rows.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-4">Cliente</th>
              <th className="py-2 pr-4">Parcela</th>
              <th className="py-2 pr-4">Parcelas</th>
              <th className="py-2 pr-4">Valor total</th>
              <th className="py-2">Remanescente</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const summary = computeReceivableSummary({
                installmentAmountCents: row.installment_amount_cents,
                totalInstallments: row.total_installments,
                paidInstallments: row.paid_installments,
              });
              return (
                <tr key={row.contract_id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">
                    <Link
                      href={`/contratos/${row.contract_id}`}
                      className="text-gray-900 underline-offset-2 hover:underline"
                    >
                      {row.client_name}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">
                    {formatCents(summary.installmentAmountCents)}
                  </td>
                  <td className="py-2 pr-4">
                    {summary.totalInstallments === null
                      ? "sem prazo definido"
                      : `${summary.paidInstallments}/${summary.totalInstallments} pagas`}
                  </td>
                  <td className="py-2 pr-4">
                    {summary.totalAmountCents === null
                      ? "-"
                      : formatCents(summary.totalAmountCents)}
                  </td>
                  <td className="py-2">
                    {summary.remainingAmountCents === null
                      ? "-"
                      : formatCents(summary.remainingAmountCents)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}

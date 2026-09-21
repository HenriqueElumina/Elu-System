import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { centsToReais } from "@/lib/validation/service";
import { PAYABLE_STATUS_LABELS } from "@/lib/validation/payable";
import { MarcarPayablePaga } from "./marcar-payable-paga";
import { ReverterPayablePagamento } from "./reverter-payable-pagamento";

export default async function ContasAPagarPage() {
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

  const canManageFinance =
    profile.role === "socio" || profile.role === "financeiro";

  const { data: payables, error } = await supabase
    .from("payable")
    .select(
      "id, description, amount_cents, due_date, status, bank_account:bank_account_id(name)",
    )
    .is("deleted_at", null)
    .order("due_date");

  const { data: bankAccounts } = canManageFinance
    ? await supabase
        .from("bank_account")
        .select("id, name")
        .eq("active", true)
        .order("name")
    : { data: null };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Contas a pagar</h1>
          <div className="flex gap-3 text-sm text-gray-500">
            <Link href="/financeiro" className="hover:underline">
              ← Financeiro
            </Link>
            <Link href="/financeiro/fluxo-de-caixa" className="hover:underline">
              Fluxo de caixa →
            </Link>
            <Link href="/financeiro/contas-bancarias" className="hover:underline">
              Contas bancárias →
            </Link>
          </div>
        </div>
        {canManageFinance && (
          <Link
            href="/financeiro/contas-a-pagar/novo"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Lançar conta
          </Link>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Erro ao carregar contas a pagar: {error.message}
        </p>
      )}

      {!error && payables?.length === 0 && (
        <p className="text-sm text-gray-500">Nenhuma conta a pagar lançada ainda.</p>
      )}

      {!error && payables && payables.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-4">Descrição</th>
              <th className="py-2 pr-4">Vencimento</th>
              <th className="py-2 pr-4">Valor</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Conta bancária</th>
              {canManageFinance && <th className="py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {payables.map((payable) => {
              const bankAccount = payable.bank_account as unknown as {
                name: string;
              } | null;
              return (
                <tr key={payable.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{payable.description}</td>
                  <td className="py-2 pr-4">
                    {new Date(payable.due_date).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-2 pr-4">
                    {centsToReais(payable.amount_cents).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="py-2 pr-4">
                    {PAYABLE_STATUS_LABELS[payable.status] ?? payable.status}
                  </td>
                  <td className="py-2 pr-4">{bankAccount?.name ?? "-"}</td>
                  {canManageFinance && (
                    <td className="py-2">
                      {payable.status === "pending" && (
                        <MarcarPayablePaga
                          payableId={payable.id}
                          bankAccounts={bankAccounts ?? []}
                        />
                      )}
                      {payable.status === "paid" && (
                        <ReverterPayablePagamento payableId={payable.id} />
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}

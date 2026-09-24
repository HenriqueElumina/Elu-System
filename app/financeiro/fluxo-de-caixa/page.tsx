import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { centsToReais } from "@/lib/validation/service";
import {
  computeCashFlowSummary,
  currentMonthStr,
  monthRange,
  type CashFlowTransaction,
} from "@/lib/billing/cashflow";

function formatCents(cents: number) {
  return centsToReais(cents).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function FluxoDeCaixaPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = monthParam || currentMonthStr();

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

  const { start, end } = monthRange(month);

  const [{ data: invoices }, { data: payables }] = await Promise.all([
    supabase
      .from("invoice")
      .select(
        "id, amount_cents, paid_at, client:client_id(legal_name, trade_name), bank_account:bank_account_id(name)",
      )
      .eq("status", "paid")
      .gte("paid_at", start)
      .lte("paid_at", `${end}T23:59:59`),
    supabase
      .from("payable")
      .select(
        "id, description, amount_cents, paid_at, bank_account:bank_account_id(name)",
      )
      .eq("status", "paid")
      .gte("paid_at", start)
      .lte("paid_at", `${end}T23:59:59`),
  ]);

  const transactions: CashFlowTransaction[] = [
    ...(invoices ?? []).map((invoice) => {
      const client = invoice.client as unknown as {
        legal_name: string;
        trade_name: string | null;
      } | null;
      const bankAccount = invoice.bank_account as unknown as {
        name: string;
      } | null;
      return {
        id: invoice.id,
        description: client?.trade_name ?? client?.legal_name ?? "Fatura",
        amountCents: invoice.amount_cents,
        date: invoice.paid_at as string,
        kind: "in" as const,
        bankAccountName: bankAccount?.name ?? null,
      };
    }),
    ...(payables ?? []).map((payable) => {
      const bankAccount = payable.bank_account as unknown as {
        name: string;
      } | null;
      return {
        id: payable.id,
        description: payable.description,
        amountCents: payable.amount_cents,
        date: payable.paid_at as string,
        kind: "out" as const,
        bankAccountName: bankAccount?.name ?? null,
      };
    }),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const summary = computeCashFlowSummary(transactions);

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Fluxo de caixa</h1>
      </div>

      <form className="mb-6 flex items-center gap-2 text-sm">
        <label htmlFor="month" className="text-gray-600">
          Mês
        </label>
        <input
          id="month"
          type="month"
          name="month"
          defaultValue={month}
          className="rounded-md border border-gray-300 px-2 py-1"
        />
        <button
          type="submit"
          className="rounded-md border border-gray-300 px-3 py-1 font-medium"
        >
          Ver
        </button>
      </form>

      <dl className="mb-8 grid grid-cols-3 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Entrou</dt>
          <dd className="text-lg font-semibold">{formatCents(summary.totalInCents)}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Saiu</dt>
          <dd className="text-lg font-semibold">{formatCents(summary.totalOutCents)}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Saldo do mês</dt>
          <dd
            className={`text-lg font-semibold ${summary.balanceCents < 0 ? "text-red-600" : ""}`}
          >
            {formatCents(summary.balanceCents)}
          </dd>
        </div>
      </dl>

      {transactions.length === 0 && (
        <p className="text-sm text-gray-500">
          Nenhum lançamento pago nesse mês.
        </p>
      )}

      {transactions.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-4">Data</th>
              <th className="py-2 pr-4">Descrição</th>
              <th className="py-2 pr-4">Tipo</th>
              <th className="py-2 pr-4">Conta bancária</th>
              <th className="py-2">Valor</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={`${t.kind}-${t.id}`} className="border-b border-gray-100">
                <td className="py-2 pr-4">
                  {new Date(t.date).toLocaleDateString("pt-BR")}
                </td>
                <td className="py-2 pr-4">{t.description}</td>
                <td className="py-2 pr-4">{t.kind === "in" ? "Entrada" : "Saída"}</td>
                <td className="py-2 pr-4">{t.bankAccountName ?? "-"}</td>
                <td className={`py-2 ${t.kind === "out" ? "text-red-600" : ""}`}>
                  {t.kind === "out" ? "-" : ""}
                  {formatCents(t.amountCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </AppShell>
  );
}

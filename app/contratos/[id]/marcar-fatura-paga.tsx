"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markInvoiceAsPaid } from "../actions";

export function MarcarFaturaPaga({
  invoiceId,
  contractId,
  bankAccounts,
}: {
  invoiceId: string;
  contractId: string;
  bankAccounts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [bankAccountId, setBankAccountId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await markInvoiceAsPaid(invoiceId, contractId, bankAccountId);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1">
      <select
        value={bankAccountId}
        onChange={(event) => setBankAccountId(event.target.value)}
        required
        className="rounded-md border border-gray-300 px-1 py-1 text-xs"
      >
        <option value="">Conta bancária...</option>
        {bankAccounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={busy}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium disabled:opacity-50"
      >
        {busy ? "Marcando..." : "Marcar como paga"}
      </button>
      {error && <p className="mt-1 w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}

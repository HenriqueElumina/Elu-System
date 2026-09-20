"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markInvoiceAsPaid } from "../actions";

export function MarcarFaturaPaga({
  invoiceId,
  contractId,
}: {
  invoiceId: string;
  contractId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    const result = await markInvoiceAsPaid(invoiceId, contractId);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={busy}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium disabled:opacity-50"
      >
        {busy ? "Marcando..." : "Marcar como paga"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

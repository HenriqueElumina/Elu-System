"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { revertPayablePayment } from "../actions";

export function ReverterPayablePagamento({ payableId }: { payableId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!window.confirm("Reverter esse pagamento? A conta volta pra pendente.")) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await revertPayablePayment(payableId);
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
        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-red-700 disabled:opacity-50"
      >
        {busy ? "Revertendo..." : "Reverter pagamento"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

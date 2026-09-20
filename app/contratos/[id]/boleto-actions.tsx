"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateBoleto, getBoletoUrl } from "../actions";

export function BoletoActions({
  invoiceId,
  contractId,
  hasCharge,
}: {
  invoiceId: string;
  contractId: string;
  hasCharge: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    const result = await generateBoleto(invoiceId, contractId);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  async function handleView() {
    setBusy(true);
    setError(null);
    const result = await getBoletoUrl(invoiceId);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <button
        onClick={hasCharge ? handleView : handleGenerate}
        disabled={busy}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium disabled:opacity-50"
      >
        {busy ? "Aguarde..." : hasCharge ? "Ver boleto" : "Gerar boleto"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

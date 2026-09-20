"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateBoleto } from "../actions";

export function BoletoActions({
  invoiceId,
  contractId,
  boletoUrl,
}: {
  invoiceId: string;
  contractId: string;
  boletoUrl: string | null;
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

  if (boletoUrl) {
    return (
      <a
        href={boletoUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-block rounded-md border border-gray-300 px-2 py-1 text-xs font-medium"
      >
        Ver boleto
      </a>
    );
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={busy}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium disabled:opacity-50"
      >
        {busy ? "Aguarde..." : "Gerar boleto"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

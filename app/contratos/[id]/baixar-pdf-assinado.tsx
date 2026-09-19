"use client";

import { useState } from "react";
import { getSignedDocumentUrl } from "../actions";

export function BaixarPdfAssinado({ contractId }: { contractId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    const result = await getSignedDocumentUrl(contractId);
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
        onClick={handleClick}
        disabled={busy}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      >
        {busy ? "Buscando..." : "Baixar PDF assinado"}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

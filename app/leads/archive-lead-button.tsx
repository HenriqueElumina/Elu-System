"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { archiveLead, unarchiveLead } from "./actions";

export function ArchiveLeadButton({
  leadId,
  archived,
}: {
  leadId: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const confirmMessage = archived
      ? "Desarquivar esse lead? Ele volta a aparecer no Kanban ativo."
      : "Arquivar esse lead? Ele sai do Kanban ativo, mas continua salvo — dá pra desarquivar depois.";
    if (!window.confirm(confirmMessage)) return;

    setBusy(true);
    setError(null);
    const result = archived ? await unarchiveLead(leadId) : await archiveLead(leadId);
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
        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 disabled:opacity-50"
      >
        {busy ? "Aguarde..." : archived ? "Desarquivar" : "Arquivar"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

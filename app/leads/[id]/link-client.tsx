"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { linkLeadToClient } from "@/app/clientes/actions";

export function LinkClient({
  leadId,
  clients,
}: {
  leadId: string;
  clients: { id: string; legal_name: string }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLink() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const result = await linkLeadToClient(leadId, selected);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm text-amber-900">
        Este lead ainda não tem um cliente vinculado.
      </p>
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Selecione um cliente já cadastrado...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.legal_name}
            </option>
          ))}
        </select>
        <button
          onClick={handleLink}
          disabled={busy || !selected}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Vincular
        </button>
      </div>
      <p className="text-sm text-amber-900">
        Ou{" "}
        <Link href={`/clientes/novo?leadId=${leadId}`} className="underline">
          cadastre um cliente novo
        </Link>
        .
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

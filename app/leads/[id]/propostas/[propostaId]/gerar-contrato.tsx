"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createContractFromProposal } from "@/app/contratos/actions";

export function GerarContrato({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    const result = await createContractFromProposal(proposalId, {
      startDate,
      endDate,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`/contratos/${result.contractId}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
      >
        Gerar contrato
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-gray-200 p-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Data de início</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Data de fim</span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={busy}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Gerando..." : "Confirmar"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

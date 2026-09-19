"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABELS,
} from "@/lib/validation/contract";
import { updateContractStatus } from "../actions";

export function ContratoStatusChanger({
  contractId,
  currentStatus,
}: {
  contractId: string;
  currentStatus: (typeof CONTRACT_STATUSES)[number];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(status: (typeof CONTRACT_STATUSES)[number]) {
    setBusy(true);
    setError(null);
    const result = await updateContractStatus(contractId, status);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-1">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Status do contrato</span>
        <select
          defaultValue={currentStatus}
          disabled={busy}
          onChange={(event) =>
            handleChange(
              event.target.value as (typeof CONTRACT_STATUSES)[number],
            )
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {CONTRACT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {CONTRACT_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-gray-500">
        Assinatura digital ainda é manual por enquanto — a integração com
        ZapSign é a próxima etapa.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/validation/lead";
import { changeLeadStatus } from "../actions";

export function StatusChanger({
  leadId,
  currentStatus,
  currentLostReason,
}: {
  leadId: string;
  currentStatus: (typeof LEAD_STATUSES)[number];
  currentLostReason: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [lostReason, setLostReason] = useState(currentLostReason ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(newStatus: typeof status) {
    setStatus(newStatus);
    if (newStatus !== "lost") {
      await save(newStatus, "");
    }
  }

  async function save(newStatus: typeof status, reason: string) {
    setBusy(true);
    setError(null);
    const result = await changeLeadStatus(leadId, newStatus, reason);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2 rounded-md border border-gray-200 p-3">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Estágio</span>
        <select
          value={status}
          onChange={(event) =>
            handleChange(event.target.value as (typeof LEAD_STATUSES)[number])
          }
          disabled={busy}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      {status === "lost" && (
        <div className="space-y-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">
              Motivo da perda (opcional)
            </span>
            <input
              value={lostReason}
              onChange={(event) => setLostReason(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            onClick={() => save("lost", lostReason)}
            disabled={busy}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

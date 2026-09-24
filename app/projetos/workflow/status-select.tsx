"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CONTENT_DEMAND_STATUSES,
  CONTENT_DEMAND_STATUS_LABELS,
} from "@/lib/validation/content-demand";
import { updateContentDemandStatus } from "./actions";

export function StatusSelect({
  demandId,
  currentStatus,
}: {
  demandId: string;
  currentStatus: (typeof CONTENT_DEMAND_STATUSES)[number];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(status: (typeof CONTENT_DEMAND_STATUSES)[number]) {
    setBusy(true);
    setError(null);
    const result = await updateContentDemandStatus(demandId, status);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <select
        defaultValue={currentStatus}
        disabled={busy}
        onChange={(event) =>
          handleChange(
            event.target.value as (typeof CONTENT_DEMAND_STATUSES)[number],
          )
        }
        className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs disabled:opacity-50"
      >
        {CONTENT_DEMAND_STATUSES.map((status) => (
          <option key={status} value={status}>
            {CONTENT_DEMAND_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

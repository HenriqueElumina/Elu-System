"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
} from "@/lib/validation/project";
import { updateProjectStatus } from "./actions";

export function StatusSelect({
  projectId,
  currentStatus,
}: {
  projectId: string;
  currentStatus: (typeof PROJECT_STATUSES)[number];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(status: (typeof PROJECT_STATUSES)[number]) {
    setBusy(true);
    setError(null);
    const result = await updateProjectStatus(projectId, status);
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
            event.target.value as (typeof PROJECT_STATUSES)[number],
          )
        }
        className="rounded-md border border-gray-300 px-2 py-1 text-xs disabled:opacity-50"
      >
        {PROJECT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {PROJECT_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

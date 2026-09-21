"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTaskStatus } from "../actions";
import type { TaskStatus } from "@/lib/validation/task";

export function TaskStatusActions({
  taskId,
  projectId,
  status,
}: {
  taskId: string;
  projectId: string;
  status: TaskStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(nextStatus: TaskStatus) {
    setBusy(true);
    setError(null);
    const result = await updateTaskStatus(taskId, nextStatus, projectId);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex gap-1">
        {status === "pending" && (
          <button
            onClick={() => handleChange("in_progress")}
            disabled={busy}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium disabled:opacity-50"
          >
            Iniciar
          </button>
        )}
        {status === "in_progress" && (
          <button
            onClick={() => handleChange("done")}
            disabled={busy}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium disabled:opacity-50"
          >
            Concluir
          </button>
        )}
        {status === "done" && (
          <button
            onClick={() => handleChange("pending")}
            disabled={busy}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium disabled:opacity-50"
          >
            Reabrir
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

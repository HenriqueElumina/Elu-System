"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { duplicateTask } from "../actions";

export function DuplicateTaskButton({
  taskId,
  projectId,
}: {
  taskId: string;
  projectId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    const result = await duplicateTask(taskId, projectId);
    setBusy(false);
    if (!result.ok) {
      window.alert(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium disabled:opacity-50"
    >
      {busy ? "Duplicando..." : "Duplicar"}
    </button>
  );
}

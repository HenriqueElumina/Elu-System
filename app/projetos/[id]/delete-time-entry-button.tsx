"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTimeEntry } from "../actions";

export function DeleteTimeEntryButton({
  timeEntryId,
  projectId,
}: {
  timeEntryId: string;
  projectId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!window.confirm("Apagar esse lançamento de tempo?")) return;
    setBusy(true);
    const result = await deleteTimeEntry(timeEntryId, projectId);
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
      className="text-red-600 underline-offset-2 hover:underline disabled:opacity-50"
    >
      apagar
    </button>
  );
}

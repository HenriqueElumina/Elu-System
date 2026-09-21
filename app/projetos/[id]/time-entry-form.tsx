"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTimeEntry } from "../actions";

function todayLocalDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export function TimeEntryForm({
  taskId,
  projectId,
}: {
  taskId: string;
  projectId: string;
}) {
  const router = useRouter();
  const [workDate, setWorkDate] = useState(todayLocalDate());
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await createTimeEntry(taskId, projectId, {
      workDate,
      hours: Number(hours),
      note: note.trim() || undefined,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setHours("");
    setNote("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      <input
        type="date"
        value={workDate}
        onChange={(event) => setWorkDate(event.target.value)}
        className="rounded-md border border-gray-300 px-1 py-1"
      />
      <input
        type="number"
        step="0.25"
        min="0"
        placeholder="Horas"
        value={hours}
        onChange={(event) => setHours(event.target.value)}
        className="w-20 rounded-md border border-gray-300 px-1 py-1"
      />
      <input
        type="text"
        placeholder="Nota (opcional)"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="min-w-32 flex-1 rounded-md border border-gray-300 px-1 py-1"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-md border border-gray-300 px-2 py-1 font-medium disabled:opacity-50"
      >
        {busy ? "Salvando..." : "Lançar tempo"}
      </button>
      {error && <p className="w-full text-red-600">{error}</p>}
    </form>
  );
}

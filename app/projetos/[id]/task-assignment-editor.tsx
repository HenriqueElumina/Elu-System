"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTaskDetails } from "../actions";

export function TaskAssignmentEditor({
  taskId,
  projectId,
  assignedTo,
  estimatedHours,
  assignees,
}: {
  taskId: string;
  projectId: string;
  assignedTo: string | null;
  estimatedHours: number | null;
  assignees: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [selectedAssignee, setSelectedAssignee] = useState(assignedTo ?? "");
  const [hours, setHours] = useState(estimatedHours?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await updateTaskDetails(taskId, projectId, {
      assignedTo: selectedAssignee || null,
      estimatedHours: hours.trim() === "" ? null : Number(hours),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      <select
        value={selectedAssignee}
        onChange={(event) => setSelectedAssignee(event.target.value)}
        className="rounded-md border border-gray-300 px-1 py-1"
      >
        <option value="">Sem responsável</option>
        {assignees.map((assignee) => (
          <option key={assignee.id} value={assignee.id}>
            {assignee.full_name}
          </option>
        ))}
      </select>
      <input
        type="number"
        step="0.5"
        min="0"
        placeholder="Horas estimadas"
        value={hours}
        onChange={(event) => setHours(event.target.value)}
        className="w-28 rounded-md border border-gray-300 px-1 py-1"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-md border border-gray-300 px-2 py-1 font-medium disabled:opacity-50"
      >
        {busy ? "Salvando..." : "Salvar"}
      </button>
      {error && <p className="w-full text-red-600">{error}</p>}
    </form>
  );
}

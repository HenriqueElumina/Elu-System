"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTask } from "../actions";

export function NewTaskForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await createTask(projectId, {
      title,
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      estimatedHours: estimatedHours.trim() === "" ? undefined : Number(estimatedHours),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setTitle("");
    setDescription("");
    setDueDate("");
    setEstimatedHours("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium"
      >
        + Nova tarefa
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-gray-200 p-3">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Título</span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Descrição (opcional)</span>
        <input
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <div className="flex gap-2">
        <label className="block flex-1 space-y-1">
          <span className="text-sm font-medium">Prazo (opcional)</span>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block flex-1 space-y-1">
          <span className="text-sm font-medium">Estimativa (h, opcional)</span>
          <input
            type="number"
            step="0.5"
            min="0"
            value={estimatedHours}
            onChange={(event) => setEstimatedHours(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Salvando..." : "Criar tarefa"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

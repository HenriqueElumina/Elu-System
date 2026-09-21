"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTask } from "../actions";

export function EditTaskForm({
  taskId,
  projectId,
  title,
  description,
  dueDate,
}: {
  taskId: string;
  projectId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [descriptionValue, setDescriptionValue] = useState(description ?? "");
  const [dueDateValue, setDueDateValue] = useState(dueDate ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await updateTask(taskId, projectId, {
      title: titleValue,
      description: descriptionValue.trim() || undefined,
      dueDate: dueDateValue || undefined,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium"
      >
        Editar
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 rounded-md border border-gray-200 p-3">
      <label className="block space-y-1">
        <span className="text-xs font-medium">Título</span>
        <input
          type="text"
          value={titleValue}
          onChange={(event) => setTitleValue(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium">Descrição</span>
        <input
          type="text"
          value={descriptionValue}
          onChange={(event) => setDescriptionValue(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium">Prazo</span>
        <input
          type="date"
          value={dueDateValue}
          onChange={(event) => setDueDateValue(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
      </label>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {busy ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

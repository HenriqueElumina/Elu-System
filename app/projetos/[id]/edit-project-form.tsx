"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
} from "@/lib/validation/project";
import { updateProject, updateProjectStatus } from "../actions";

type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function EditProjectForm({
  projectId,
  name,
  status,
  startDate,
  endDate,
}: {
  projectId: string;
  name: string;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const [statusValue, setStatusValue] = useState<ProjectStatus>(status);
  const [startDateValue, setStartDateValue] = useState(startDate ?? "");
  const [endDateValue, setEndDateValue] = useState(endDate ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const dataResult = await updateProject(projectId, {
      name: nameValue,
      startDate: startDateValue || null,
      endDate: endDateValue || null,
    });
    if (!dataResult.ok) {
      setBusy(false);
      setError(dataResult.message);
      return;
    }

    if (statusValue !== status) {
      const statusResult = await updateProjectStatus(projectId, statusValue);
      if (!statusResult.ok) {
        setBusy(false);
        setError(statusResult.message);
        return;
      }
    }

    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium"
      >
        Editar projeto
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 space-y-2 rounded-md border border-gray-200 p-3"
    >
      <label className="block space-y-1">
        <span className="text-xs font-medium">Nome</span>
        <input
          type="text"
          value={nameValue}
          onChange={(event) => setNameValue(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium">Status</span>
        <select
          value={statusValue}
          onChange={(event) => setStatusValue(event.target.value as ProjectStatus)}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
        >
          {PROJECT_STATUSES.map((option) => (
            <option key={option} value={option}>
              {PROJECT_STATUS_LABELS[option]}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <label className="block flex-1 space-y-1">
          <span className="text-xs font-medium">Início</span>
          <input
            type="date"
            value={startDateValue}
            onChange={(event) => setStartDateValue(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="block flex-1 space-y-1">
          <span className="text-xs font-medium">Fim</span>
          <input
            type="date"
            value={endDateValue}
            onChange={(event) => setEndDateValue(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
      </div>

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

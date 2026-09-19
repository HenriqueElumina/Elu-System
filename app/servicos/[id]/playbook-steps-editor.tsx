"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addPlaybookStep,
  deletePlaybookStep,
  movePlaybookStep,
  updatePlaybookStep,
} from "../actions";

type Step = {
  id: string;
  position: number;
  name: string;
  description: string | null;
  sla_days: number | null;
};

export function PlaybookStepsEditor({
  serviceId,
  steps,
  canEdit,
}: {
  serviceId: string;
  steps: Step[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    setBusy(true);
    setError(null);
    const result = await action();
    if (!result.ok) setError(result.message ?? "Erro.");
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      {steps.length === 0 && (
        <p className="text-sm text-gray-500">Nenhuma etapa cadastrada ainda.</p>
      )}

      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className="rounded-md border border-gray-200 p-3 text-sm"
          >
            {editingId === step.id ? (
              <StepForm
                initial={step}
                onCancel={() => setEditingId(null)}
                onSave={(values) =>
                  run(async () => {
                    const result = await updatePlaybookStep(step.id, serviceId, values);
                    setEditingId(null);
                    return result;
                  })
                }
              />
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {index + 1}. {step.name}
                  </p>
                  {step.description && (
                    <p className="text-gray-600">{step.description}</p>
                  )}
                  {step.sla_days != null && (
                    <p className="text-gray-500">SLA: {step.sla_days} dia(s)</p>
                  )}
                </div>
                {canEdit && (
                  <div className="flex shrink-0 gap-1">
                    <IconButton
                      disabled={busy || index === 0}
                      onClick={() => run(() => movePlaybookStep(step.id, serviceId, "up"))}
                      label="Mover para cima"
                    >
                      ↑
                    </IconButton>
                    <IconButton
                      disabled={busy || index === steps.length - 1}
                      onClick={() => run(() => movePlaybookStep(step.id, serviceId, "down"))}
                      label="Mover para baixo"
                    >
                      ↓
                    </IconButton>
                    <IconButton
                      disabled={busy}
                      onClick={() => setEditingId(step.id)}
                      label="Editar"
                    >
                      ✎
                    </IconButton>
                    <IconButton
                      disabled={busy}
                      onClick={() => run(() => deletePlaybookStep(step.id, serviceId))}
                      label="Remover"
                    >
                      ✕
                    </IconButton>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {canEdit && (
        <>
          {adding ? (
            <div className="rounded-md border border-dashed border-gray-300 p-3">
              <StepForm
                onCancel={() => setAdding(false)}
                onSave={(values) =>
                  run(async () => {
                    const result = await addPlaybookStep(serviceId, values);
                    setAdding(false);
                    return result;
                  })
                }
              />
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              + Adicionar etapa
            </button>
          )}
        </>
      )}
    </div>
  );
}

function IconButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function StepForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Step;
  onSave: (values: { name: string; description: string; slaDays: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [slaDays, setSlaDays] = useState(
    initial?.sla_days != null ? String(initial.sla_days) : "",
  );

  return (
    <div className="space-y-2">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nome da etapa"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Descrição (opcional)"
        rows={2}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <input
        type="number"
        min={0}
        value={slaDays}
        onChange={(event) => setSlaDays(event.target.value)}
        placeholder="SLA em dias (opcional)"
        className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ name, description, slaDays })}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          Salvar
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

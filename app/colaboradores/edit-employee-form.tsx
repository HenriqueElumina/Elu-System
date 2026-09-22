"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEmployeeCompensation, updateEmployeeRoleTitle } from "./actions";

export function EditEmployeeForm({
  employeeId,
  roleTitle,
  hourlyCostReais,
  canEditRole,
  canEditCost,
}: {
  employeeId: string;
  roleTitle: string | null;
  hourlyCostReais: number | null;
  canEditRole: boolean;
  canEditCost: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roleTitleValue, setRoleTitleValue] = useState(roleTitle ?? "");
  const [hourlyCostValue, setHourlyCostValue] = useState(
    hourlyCostReais != null ? String(hourlyCostReais) : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canEditRole && !canEditCost) return null;

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    if (canEditRole) {
      const result = await updateEmployeeRoleTitle(employeeId, {
        roleTitle: roleTitleValue,
      });
      if (!result.ok) {
        setBusy(false);
        setError(result.message);
        return;
      }
    }

    if (canEditCost) {
      const result = await updateEmployeeCompensation(employeeId, {
        hourlyCostReais: hourlyCostValue.trim() === "" ? undefined : Number(hourlyCostValue),
      });
      if (!result.ok) {
        setBusy(false);
        setError(result.message);
        return;
      }
    }

    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 space-y-2 rounded-md border border-gray-200 p-3 text-left"
    >
      {canEditRole && (
        <label className="block space-y-1">
          <span className="text-xs font-medium">Cargo</span>
          <input
            type="text"
            value={roleTitleValue}
            onChange={(event) => setRoleTitleValue(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
      )}
      {canEditCost && (
        <label className="block space-y-1">
          <span className="text-xs font-medium">Custo/hora (R$)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={hourlyCostValue}
            onChange={(event) => setHourlyCostValue(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
      )}

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

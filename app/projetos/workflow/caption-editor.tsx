"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateContentDemandCaption } from "./actions";

export function CaptionEditor({
  demandId,
  currentCaption,
}: {
  demandId: string;
  currentCaption: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentCaption ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setBusy(true);
    setError(null);
    const result = await updateContentDemandCaption(demandId, value);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div>
        <p className="whitespace-pre-wrap">{currentCaption || "-"}</p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-1 text-xs text-gray-500 hover:underline"
        >
          Editar legenda
        </button>
      </div>
    );
  }

  return (
    <div>
      <textarea
        rows={4}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={busy}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
      />
      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {busy ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setValue(currentCaption ?? "");
            setEditing(false);
            setError(null);
          }}
          disabled={busy}
          className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

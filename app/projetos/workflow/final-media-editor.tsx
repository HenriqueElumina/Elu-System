"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveMediaPreview } from "@/lib/workflow/media-preview";
import { updateContentDemandFinalMedia } from "./actions";

export function FinalMediaEditor({
  demandId,
  currentUrl,
}: {
  demandId: string;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setBusy(true);
    setError(null);
    const result = await updateContentDemandFinalMedia(demandId, value);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    const preview = resolveMediaPreview(currentUrl);
    return (
      <div>
        {currentUrl ? (
          <a
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            className="text-gray-900 underline-offset-2 hover:underline"
          >
            {currentUrl}
          </a>
        ) : (
          <p className="text-gray-400">-</p>
        )}
        {preview.kind === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.url}
            alt=""
            className="mt-2 max-h-80 rounded-md border border-gray-200"
          />
        )}
        {preview.kind === "drive" && (
          <iframe
            src={preview.embedUrl}
            className="mt-2 h-80 w-full rounded-md border border-gray-200"
            allow="autoplay"
          />
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-1 text-xs text-gray-500 hover:underline"
        >
          {currentUrl ? "Editar link" : "Adicionar link do material final"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="url"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={busy}
        placeholder="https://drive.google.com/..."
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
            setValue(currentUrl ?? "");
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

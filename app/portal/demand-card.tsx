"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveMediaPreview } from "@/lib/workflow/media-preview";
import { approveContentDemand, requestContentDemandChanges } from "./actions";

export function DemandCard({
  demandId,
  title,
  channelsLabel,
  scheduledAtLabel,
  caption,
  finalMediaUrl,
}: {
  demandId: string;
  title: string;
  channelsLabel: string;
  scheduledAtLabel: string | null;
  caption: string | null;
  finalMediaUrl: string | null;
}) {
  const router = useRouter();
  const [requestingChanges, setRequestingChanges] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = resolveMediaPreview(finalMediaUrl);

  async function handleApprove() {
    setBusy(true);
    setError(null);
    const result = await approveContentDemand(demandId);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  async function handleRequestChanges() {
    setBusy(true);
    setError(null);
    const result = await requestContentDemandChanges(demandId, note);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <li className="rounded-md border border-gray-200 p-4 text-sm">
      <p className="font-medium text-gray-900">{title}</p>
      <p className="mt-1 text-xs text-gray-400">{channelsLabel}</p>
      {scheduledAtLabel && (
        <p className="mt-1 text-xs text-gray-400">
          Previsto pra {scheduledAtLabel}
        </p>
      )}

      {caption && (
        <p className="mt-3 whitespace-pre-wrap text-gray-700">{caption}</p>
      )}

      {preview.kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview.url}
          alt=""
          className="mt-3 max-h-80 rounded-md border border-gray-200"
        />
      )}
      {preview.kind === "drive" && (
        <iframe
          src={preview.embedUrl}
          className="mt-3 h-80 w-full rounded-md border border-gray-200"
          allow="autoplay"
        />
      )}
      {finalMediaUrl && preview.kind === "none" && (
        <a
          href={finalMediaUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block text-gray-900 underline-offset-2 hover:underline"
        >
          {finalMediaUrl}
        </a>
      )}

      {!requestingChanges ? (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleApprove}
            disabled={busy}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Aprovando..." : "Aprovar"}
          </button>
          <button
            type="button"
            onClick={() => setRequestingChanges(true)}
            disabled={busy}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            Pedir ajuste
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">O que precisa mudar?</span>
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={busy}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRequestChanges}
              disabled={busy}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? "Enviando..." : "Enviar pedido de ajuste"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRequestingChanges(false);
                setNote("");
                setError(null);
              }}
              disabled={busy}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </li>
  );
}

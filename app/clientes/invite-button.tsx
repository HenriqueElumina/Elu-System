"use client";

import { useState } from "react";
import { createInvite } from "./actions";

export function InviteButton() {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const { token } = await createInvite(note);
      setLink(`${window.location.origin}/convite/${token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar o link.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
      >
        Gerar link para novo cliente
      </button>
    );
  }

  return (
    <div className="w-full max-w-md space-y-3 rounded-md border border-gray-200 bg-white p-4">
      {!link ? (
        <>
          <label className="block space-y-1">
            <span className="text-sm font-medium">
              Nota (opcional, só pra sua referência)
            </span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ex.: Cliente indicado pelo Fulano"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Gerando..." : "Gerar link"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Copie e mande esse link para o cliente preencher (válido por 7
            dias):
          </p>
          <input
            readOnly
            value={link}
            onFocus={(event) => event.target.select()}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={() => {
              setOpen(false);
              setLink(null);
              setNote("");
            }}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            Fechar
          </button>
        </>
      )}
    </div>
  );
}

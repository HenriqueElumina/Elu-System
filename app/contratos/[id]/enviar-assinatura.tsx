"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STANDARD_EXTRAS } from "@/lib/validation/contract";
import { sendContractForSignature } from "../actions";

export function EnviarAssinatura({
  contractId,
  isResend = false,
}: {
  contractId: string;
  isResend?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [included, setIncluded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signUrls, setSignUrls] = useState<{ name: string; url: string }[] | null>(
    null,
  );

  function toggle(key: string) {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSend() {
    setBusy(true);
    setError(null);
    const result = await sendContractForSignature(contractId, Array.from(included));
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSignUrls(result.signUrls);
    router.refresh();
  }

  if (signUrls) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        <p className="font-medium">
          {isResend ? "Reenviado" : "Enviado"} para assinatura no ZapSign.
        </p>
        <ul className="mt-2 space-y-1">
          {signUrls.map((s) => (
            <li key={s.url}>
              {s.name}:{" "}
              <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                link de assinatura
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
      >
        {isResend ? "Reenviar para assinatura" : "Enviar para assinatura"}
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-gray-200 p-3">
      {isResend && (
        <p className="text-sm text-amber-700">
          Isso cria um novo envio no ZapSign (o anterior continua pendente por
          lá, mas o sistema passa a acompanhar este novo).
        </p>
      )}
      <p className="text-sm font-medium">
        Algum destes itens já está incluso no escopo deste contrato? (eles somem
        da lista de &ldquo;não inclusos&rdquo; do PDF)
      </p>
      {STANDARD_EXTRAS.map((extra) => (
        <label key={extra.key} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={included.has(extra.key)}
            onChange={() => toggle(extra.key)}
          />
          {extra.label} ({extra.priceLabel})
        </label>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSend}
          disabled={busy}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Enviando..." : isResend ? "Confirmar e reenviar" : "Confirmar e enviar"}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={busy}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

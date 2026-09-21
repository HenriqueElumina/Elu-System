"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPayable } from "../../actions";

export function NovaContaPagarClient() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amountReais, setAmountReais] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await createPayable({
      description,
      amountReais: Number(amountReais),
      dueDate,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push("/financeiro/contas-a-pagar");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Descrição</span>
        <input
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Ex.: Aluguel do escritório"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Valor (R$)</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amountReais}
          onChange={(event) => setAmountReais(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Vencimento</span>
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "Salvando..." : "Lançar conta"}
      </button>
    </form>
  );
}

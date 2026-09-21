"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBankAccount } from "../../actions";

export function NovaContaBancariaClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [agency, setAgency] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await createBankAccount({
      name,
      bankName,
      agency,
      accountNumber,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push("/financeiro/contas-bancarias");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Nome/apelido</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Ex.: Conta principal"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Banco</span>
        <input
          type="text"
          value={bankName}
          onChange={(event) => setBankName(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Ex.: Banco do Brasil"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Agência</span>
        <input
          type="text"
          value={agency}
          onChange={(event) => setAgency(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Número da conta</span>
        <input
          type="text"
          value={accountNumber}
          onChange={(event) => setAccountNumber(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "Salvando..." : "Cadastrar conta"}
      </button>
    </form>
  );
}

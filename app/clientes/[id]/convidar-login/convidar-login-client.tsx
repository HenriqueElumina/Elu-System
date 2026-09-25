"use client";

import { useState } from "react";
import { createClientUserInvite } from "../../actions";

export function ConvidarLoginClient({ clientId }: { clientId: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await createClientUserInvite(clientId, { email });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setLink(`${window.location.origin}/convite-cliente/${result.token}`);
  }

  if (link) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Copie e mande esse link pra pessoa criar a própria conta (válido
          por 7 dias):
        </p>
        <input
          readOnly
          value={link}
          onFocus={(event) => event.target.select()}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium">E-mail</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "Gerando..." : "Gerar link de convite"}
      </button>
    </form>
  );
}

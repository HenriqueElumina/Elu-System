"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setEmployeeActive } from "./actions";

export function DeactivateEmployeeButton({
  employeeId,
  active,
}: {
  employeeId: string;
  active: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const confirmMessage = active
      ? "Desativar esse colaborador? Ele perde acesso ao sistema imediatamente, mas o histórico é mantido. Dá pra reativar depois."
      : "Reativar esse colaborador? Ele volta a ter acesso ao sistema.";
    if (!window.confirm(confirmMessage)) return;

    setBusy(true);
    setError(null);
    const result = await setEmployeeActive(employeeId, !active);
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={busy}
        className={`rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50 ${
          active ? "border-gray-300 text-red-700" : "border-gray-300"
        }`}
      >
        {busy ? "Aguarde..." : active ? "Desativar" : "Reativar"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveClient } from "../actions";

export function ApproveButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setLoading(true);
    setError(null);
    try {
      await approveClient(clientId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao aprovar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Aprovando..." : "Aprovar cadastro"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

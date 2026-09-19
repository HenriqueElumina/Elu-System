"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_LABELS,
} from "@/lib/validation/proposal";
import { changeProposalStatus } from "../../../actions";

export function PropostaStatusChanger({
  leadId,
  proposalId,
  currentStatus,
}: {
  leadId: string;
  proposalId: string;
  currentStatus: (typeof PROPOSAL_STATUSES)[number];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(status: (typeof PROPOSAL_STATUSES)[number]) {
    setBusy(true);
    setError(null);
    const result = await changeProposalStatus(proposalId, leadId, status);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-1">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Status da proposta</span>
        <select
          defaultValue={currentStatus}
          disabled={busy}
          onChange={(event) =>
            handleChange(
              event.target.value as (typeof PROPOSAL_STATUSES)[number],
            )
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {PROPOSAL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {PROPOSAL_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

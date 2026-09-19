"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProposalForm } from "@/components/proposal-form";
import type {
  ProposalFormInput,
  ProposalInput,
} from "@/lib/validation/proposal";
import { updateProposal } from "../../../actions";

export function EditarPropostaClient({
  leadId,
  proposalId,
  services,
  defaultValues,
}: {
  leadId: string;
  proposalId: string;
  services: { id: string; name: string; base_price_cents: number }[];
  defaultValues: ProposalFormInput;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  async function handleSubmit(data: ProposalInput) {
    const result = await updateProposal(proposalId, leadId, data);
    if (!result.ok) {
      return { ok: false as const, message: result.message };
    }
    setSaved(true);
    router.refresh();
    return { ok: true as const };
  }

  return (
    <div className="space-y-3">
      {saved && <p className="text-sm text-green-700">Alterações salvas.</p>}
      <ProposalForm
        services={services}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitLabel="Salvar alterações"
      />
    </div>
  );
}

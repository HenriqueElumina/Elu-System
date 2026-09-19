"use client";

import { useRouter } from "next/navigation";
import { ProposalForm } from "@/components/proposal-form";
import type { ProposalInput } from "@/lib/validation/proposal";
import { createProposal } from "../../../actions";

export function NovaPropostaClient({
  leadId,
  services,
}: {
  leadId: string;
  services: { id: string; name: string; base_price_cents: number }[];
}) {
  const router = useRouter();

  async function handleSubmit(data: ProposalInput) {
    const result = await createProposal(leadId, data);
    if (!result.ok) {
      return { ok: false as const, message: result.message };
    }
    router.push(`/leads/${leadId}/propostas/${result.proposalId}`);
    return { ok: true as const };
  }

  return (
    <ProposalForm
      services={services}
      onSubmit={handleSubmit}
      submitLabel="Criar proposta"
    />
  );
}

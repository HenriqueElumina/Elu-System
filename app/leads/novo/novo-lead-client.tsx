"use client";

import { useRouter } from "next/navigation";
import { LeadForm } from "@/components/lead-form";
import type { LeadInput } from "@/lib/validation/lead";
import { createLead } from "../actions";

export function NovoLeadClient() {
  const router = useRouter();

  async function handleSubmit(data: LeadInput) {
    const result = await createLead(data);
    if (!result.ok) {
      return { ok: false as const, message: result.message };
    }
    router.push(`/leads/${result.leadId}`);
    return { ok: true as const };
  }

  return <LeadForm onSubmit={handleSubmit} submitLabel="Cadastrar lead" />;
}

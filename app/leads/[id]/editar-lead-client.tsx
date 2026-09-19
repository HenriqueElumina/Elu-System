"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LeadForm } from "@/components/lead-form";
import type { LeadFormInput, LeadInput } from "@/lib/validation/lead";
import { updateLead } from "../actions";

export function EditarLeadClient({
  leadId,
  defaultValues,
}: {
  leadId: string;
  defaultValues: LeadFormInput;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  async function handleSubmit(data: LeadInput) {
    const result = await updateLead(leadId, data);
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
      <LeadForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitLabel="Salvar alterações"
      />
    </div>
  );
}

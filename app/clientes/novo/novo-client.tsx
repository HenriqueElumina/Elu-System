"use client";

import { useRouter } from "next/navigation";
import { ClientIntakeForm } from "@/components/client-intake-form";
import type { ClientIntakeInput } from "@/lib/validation/client-intake";
import { createClientDirect } from "../actions";

export function NovoClienteClient({ leadId }: { leadId?: string }) {
  const router = useRouter();

  async function handleSubmit(data: ClientIntakeInput) {
    const result = await createClientDirect(data, leadId);
    if (!result.ok) {
      return { ok: false as const, message: result.message };
    }
    router.push(leadId ? `/leads/${leadId}` : `/clientes/${result.clientId}`);
    return { ok: true as const };
  }

  return (
    <ClientIntakeForm
      onSubmit={handleSubmit}
      submitLabel="Cadastrar cliente"
      successMessage="Cliente cadastrado."
    />
  );
}

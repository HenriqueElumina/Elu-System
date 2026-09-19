"use client";

import { useRouter } from "next/navigation";
import { ClientIntakeForm } from "@/components/client-intake-form";
import type { ClientIntakeInput } from "@/lib/validation/client-intake";
import { createClientDirect } from "../actions";

export function NovoClienteClient() {
  const router = useRouter();

  async function handleSubmit(data: ClientIntakeInput) {
    const result = await createClientDirect(data);
    if (!result.ok) {
      return { ok: false as const, message: result.message };
    }
    router.push(`/clientes/${result.clientId}`);
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

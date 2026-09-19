"use client";

import { useRouter } from "next/navigation";
import { ServiceForm } from "@/components/service-form";
import type { ServiceInput } from "@/lib/validation/service";
import { createService } from "../actions";

export function NovoServicoClient() {
  const router = useRouter();

  async function handleSubmit(data: ServiceInput) {
    const result = await createService(data);
    if (!result.ok) {
      return { ok: false as const, message: result.message };
    }
    router.push(`/servicos/${result.serviceId}`);
    return { ok: true as const };
  }

  return <ServiceForm onSubmit={handleSubmit} submitLabel="Cadastrar serviço" />;
}

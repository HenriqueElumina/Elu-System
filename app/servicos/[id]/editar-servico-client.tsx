"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ServiceForm } from "@/components/service-form";
import type { ServiceFormInput, ServiceInput } from "@/lib/validation/service";
import { updateService } from "../actions";

export function EditarServicoClient({
  serviceId,
  defaultValues,
}: {
  serviceId: string;
  defaultValues: ServiceFormInput;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  async function handleSubmit(data: ServiceInput) {
    const result = await updateService(serviceId, data);
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
      <ServiceForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitLabel="Salvar alterações"
      />
    </div>
  );
}

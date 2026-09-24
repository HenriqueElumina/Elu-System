"use client";

import { useRouter } from "next/navigation";
import { ContentDemandForm } from "@/components/content-demand-form";
import type { CreateContentDemandInput } from "@/lib/validation/content-demand";
import { createContentDemand } from "./actions";

export function NovaDemandaClient({
  clients,
  assignees,
}: {
  clients: { id: string; legal_name: string }[];
  assignees: { id: string; full_name: string }[];
}) {
  const router = useRouter();

  async function handleSubmit(data: CreateContentDemandInput) {
    const result = await createContentDemand(data);
    if (!result.ok) {
      return { ok: false as const, message: result.message };
    }
    router.push("/projetos/workflow");
    return { ok: true as const };
  }

  return (
    <ContentDemandForm
      clients={clients}
      assignees={assignees}
      onSubmit={handleSubmit}
    />
  );
}

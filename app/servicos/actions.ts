"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  playbookStepSchema,
  reaisToCents,
  serviceSchema,
  type PlaybookStepFormInput,
  type ServiceInput,
} from "@/lib/validation/service";

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : T))
  | { ok: false; message: string };

export async function createService(
  input: ServiceInput,
): Promise<ActionResult<{ serviceId: string }>> {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const { data: service, error } = await supabase
    .from("service")
    .insert({
      name: data.name,
      description: data.description || null,
      service_line: data.serviceLine,
      billing_type: data.billingType,
      base_price_cents: reaisToCents(data.basePriceReais),
      active: data.active,
    })
    .select("id")
    .single();

  if (error || !service) {
    return { ok: false, message: error?.message ?? "Erro ao criar serviço." };
  }

  revalidatePath("/servicos");
  return { ok: true, serviceId: service.id as string };
}

export async function updateService(
  serviceId: string,
  input: ServiceInput,
): Promise<ActionResult> {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("service")
    .update({
      name: data.name,
      description: data.description || null,
      service_line: data.serviceLine,
      billing_type: data.billingType,
      base_price_cents: reaisToCents(data.basePriceReais),
      active: data.active,
    })
    .eq("id", serviceId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/servicos");
  revalidatePath(`/servicos/${serviceId}`);
  return { ok: true };
}

export async function addPlaybookStep(
  serviceId: string,
  input: PlaybookStepFormInput,
): Promise<ActionResult> {
  const parsed = playbookStepSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();

  const { data: last } = await supabase
    .from("playbook_step")
    .select("position")
    .eq("service_id", serviceId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (last?.position ?? 0) + 1;

  const { error } = await supabase.from("playbook_step").insert({
    service_id: serviceId,
    position: nextPosition,
    name: data.name,
    description: data.description || null,
    sla_days: data.slaDays ?? null,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/servicos/${serviceId}`);
  return { ok: true };
}

export async function updatePlaybookStep(
  stepId: string,
  serviceId: string,
  input: PlaybookStepFormInput,
): Promise<ActionResult> {
  const parsed = playbookStepSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("playbook_step")
    .update({
      name: data.name,
      description: data.description || null,
      sla_days: data.slaDays ?? null,
    })
    .eq("id", stepId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/servicos/${serviceId}`);
  return { ok: true };
}

export async function deletePlaybookStep(
  stepId: string,
  serviceId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("playbook_step").delete().eq("id", stepId);
  if (error) return { ok: false, message: error.message };

  const { data: remaining } = await supabase
    .from("playbook_step")
    .select("id")
    .eq("service_id", serviceId)
    .order("position", { ascending: true });

  if (remaining) {
    for (let i = 0; i < remaining.length; i++) {
      await supabase
        .from("playbook_step")
        .update({ position: i + 1 })
        .eq("id", remaining[i]!.id);
    }
  }

  revalidatePath(`/servicos/${serviceId}`);
  return { ok: true };
}

export async function movePlaybookStep(
  stepId: string,
  serviceId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: steps } = await supabase
    .from("playbook_step")
    .select("id, position")
    .eq("service_id", serviceId)
    .order("position", { ascending: true });

  if (!steps) return { ok: false, message: "Etapas não encontradas." };

  const index = steps.findIndex((step) => step.id === stepId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || targetIndex < 0 || targetIndex >= steps.length) {
    return { ok: true };
  }

  const current = steps[index]!;
  const target = steps[targetIndex]!;

  const { error: error1 } = await supabase
    .from("playbook_step")
    .update({ position: target.position })
    .eq("id", current.id);
  const { error: error2 } = await supabase
    .from("playbook_step")
    .update({ position: current.position })
    .eq("id", target.id);

  if (error1 || error2) {
    return { ok: false, message: (error1 ?? error2)?.message ?? "Erro ao reordenar." };
  }

  revalidatePath(`/servicos/${serviceId}`);
  return { ok: true };
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createContentDemandSchema,
  parseTags,
  CONTENT_DEMAND_STATUSES,
  type CreateContentDemandInput,
} from "@/lib/validation/content-demand";

const finalMediaUrlSchema = z
  .string()
  .trim()
  .url("Link inválido")
  .optional()
  .or(z.literal(""));

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : T))
  | { ok: false; message: string };

export async function createContentDemand(
  input: CreateContentDemandInput,
): Promise<ActionResult<{ demandId: string }>> {
  const parsed = createContentDemandSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { data: demand, error } = await supabase
    .from("content_demand")
    .insert({
      title: data.title,
      client_id: data.clientId,
      assigned_to: data.assignedTo || null,
      channels: data.channels,
      scheduled_at: data.scheduledAt || null,
      briefing: data.briefing || null,
      media_url: data.mediaUrl || null,
      tags: parseTags(data.tags),
      caption: data.caption || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !demand) {
    return { ok: false, message: error?.message ?? "Erro ao criar demanda." };
  }

  revalidatePath("/projetos/workflow");
  return { ok: true, demandId: demand.id as string };
}

export async function updateContentDemandStatus(
  demandId: string,
  status: (typeof CONTENT_DEMAND_STATUSES)[number],
): Promise<ActionResult> {
  if (!CONTENT_DEMAND_STATUSES.includes(status)) {
    return { ok: false, message: "Status inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_content_demand_status", {
    p_demand_id: demandId,
    p_status: status,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/projetos/workflow");
  return { ok: true };
}

export async function updateContentDemandCaption(
  demandId: string,
  caption: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_content_demand_caption", {
    p_demand_id: demandId,
    p_caption: caption || null,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/projetos/workflow/${demandId}`);
  return { ok: true };
}

export async function updateContentDemandFinalMedia(
  demandId: string,
  finalMediaUrl: string,
): Promise<ActionResult> {
  const parsed = finalMediaUrlSchema.safeParse(finalMediaUrl);
  if (!parsed.success) return { ok: false, message: "Link inválido." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_content_demand_final_media", {
    p_demand_id: demandId,
    p_final_media_url: parsed.data || null,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/projetos/workflow/${demandId}`);
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requestContentDemandChangesSchema } from "@/lib/validation/client-user";

type ActionResult = { ok: true } | { ok: false; message: string };

export async function approveContentDemand(demandId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_content_demand_status", {
    p_demand_id: demandId,
    p_status: "approved_scheduled",
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/portal");
  return { ok: true };
}

export async function requestContentDemandChanges(
  demandId: string,
  note: string,
): Promise<ActionResult> {
  const parsed = requestContentDemandChangesSchema.safeParse({ note });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_content_demand_changes", {
    p_demand_id: demandId,
    p_note: parsed.data.note,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/portal");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { taskDetailsSchema, type TaskStatus } from "@/lib/validation/task";

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : T))
  | { ok: false; message: string };

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  projectId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_task_status", {
    p_task_id: taskId,
    p_status: status,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/projetos/${projectId}`);
  return { ok: true };
}

export async function updateTaskDetails(
  taskId: string,
  projectId: string,
  input: { assignedTo: string | null; estimatedHours: number | null },
): Promise<ActionResult> {
  const parsed = taskDetailsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("task")
    .update({ assigned_to: data.assignedTo, estimated_hours: data.estimatedHours })
    .eq("id", taskId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/projetos/${projectId}`);
  return { ok: true };
}

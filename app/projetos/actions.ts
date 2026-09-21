"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskStatus } from "@/lib/validation/task";

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

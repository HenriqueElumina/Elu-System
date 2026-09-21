"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createTaskSchema,
  editTaskSchema,
  taskDetailsSchema,
  type CreateTaskInput,
  type EditTaskInput,
  type TaskStatus,
} from "@/lib/validation/task";
import { timeEntrySchema, type TimeEntryInput } from "@/lib/validation/time-entry";

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

export async function createTimeEntry(
  taskId: string,
  projectId: string,
  input: TimeEntryInput,
): Promise<ActionResult> {
  const parsed = timeEntrySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sessão expirada." };

  const { error } = await supabase.from("time_entry").insert({
    task_id: taskId,
    profile_id: user.id,
    work_date: data.workDate,
    hours: data.hours,
    note: data.note || null,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/projetos/${projectId}`);
  return { ok: true };
}

export async function deleteTimeEntry(
  timeEntryId: string,
  projectId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("time_entry")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", timeEntryId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/projetos/${projectId}`);
  return { ok: true };
}

export async function createTask(
  projectId: string,
  input: CreateTaskInput,
): Promise<ActionResult> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const { count } = await supabase
    .from("task")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .is("deleted_at", null);

  const { error } = await supabase.from("task").insert({
    project_id: projectId,
    title: data.title,
    description: data.description || null,
    due_date: data.dueDate || null,
    estimated_hours: data.estimatedHours ?? null,
    position: (count ?? 0) + 1,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/projetos/${projectId}`);
  return { ok: true };
}

export async function duplicateTask(
  taskId: string,
  projectId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: original, error: fetchError } = await supabase
    .from("task")
    .select("title, description, due_date, estimated_hours")
    .eq("id", taskId)
    .single();

  if (fetchError || !original) {
    return { ok: false, message: "Tarefa não encontrada." };
  }

  const { count } = await supabase
    .from("task")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .is("deleted_at", null);

  const { error } = await supabase.from("task").insert({
    project_id: projectId,
    title: original.title,
    description: original.description,
    due_date: original.due_date,
    estimated_hours: original.estimated_hours,
    position: (count ?? 0) + 1,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/projetos/${projectId}`);
  return { ok: true };
}

export async function updateTask(
  taskId: string,
  projectId: string,
  input: EditTaskInput,
): Promise<ActionResult> {
  const parsed = editTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("task")
    .update({
      title: data.title,
      description: data.description || null,
      due_date: data.dueDate || null,
    })
    .eq("id", taskId);

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

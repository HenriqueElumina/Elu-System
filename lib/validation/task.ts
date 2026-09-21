import { z } from "zod";

export const TASK_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  done: "Concluída",
};

export type TaskStatus = "pending" | "in_progress" | "done";

export const taskDetailsSchema = z.object({
  assignedTo: z.string().trim().uuid().nullable(),
  estimatedHours: z.coerce.number().nonnegative().nullable(),
});

export type TaskDetailsInput = z.output<typeof taskDetailsSchema>;

export const createTaskSchema = z.object({
  title: z.string().trim().min(3, "Informe um título"),
  description: z.string().trim().max(1000).optional(),
  dueDate: z.string().trim().optional(),
  estimatedHours: z.coerce.number().nonnegative().optional(),
});

export type CreateTaskInput = z.output<typeof createTaskSchema>;

export const editTaskSchema = createTaskSchema.omit({ estimatedHours: true });

export type EditTaskInput = z.output<typeof editTaskSchema>;


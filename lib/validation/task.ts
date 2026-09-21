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


export const TASK_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  done: "Concluída",
};

export type TaskStatus = "pending" | "in_progress" | "done";

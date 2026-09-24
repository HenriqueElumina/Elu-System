export const PROJECT_STATUSES = [
  "planning",
  "active",
  "completed",
  "cancelled",
] as const;

export const PROJECT_STATUS_LABELS: Record<
  (typeof PROJECT_STATUSES)[number],
  string
> = {
  planning: "Planejamento",
  active: "Ativo",
  completed: "Concluído",
  cancelled: "Cancelado",
};

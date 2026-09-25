import { z } from "zod";

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

export const editProjectSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome do projeto."),
    startDate: z.string().min(1).nullable(),
    endDate: z.string().min(1).nullable(),
  })
  .refine(
    (data) =>
      !data.startDate || !data.endDate || data.endDate >= data.startDate,
    { message: "A data de fim não pode ser antes da data de início.", path: ["endDate"] },
  );

export type EditProjectInput = z.infer<typeof editProjectSchema>;

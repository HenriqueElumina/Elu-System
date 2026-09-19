import { z } from "zod";

export const CONTRACT_STATUSES = [
  "draft",
  "sent",
  "signed",
  "active",
  "cancelled",
  "finished",
] as const;

export const CONTRACT_STATUS_LABELS: Record<
  (typeof CONTRACT_STATUSES)[number],
  string
> = {
  draft: "Rascunho",
  sent: "Enviado",
  signed: "Assinado",
  active: "Ativo",
  cancelled: "Cancelado",
  finished: "Encerrado",
};

export const createContractSchema = z
  .object({
    startDate: z.string().trim().min(1, "Informe a data de início"),
    endDate: z.string().trim().optional().or(z.literal("")),
  })
  .refine(
    (value) => !value.endDate || value.endDate >= value.startDate,
    { message: "Data de fim não pode ser antes da data de início", path: ["endDate"] },
  );

export type CreateContractInput = z.output<typeof createContractSchema>;
export type CreateContractFormInput = z.input<typeof createContractSchema>;

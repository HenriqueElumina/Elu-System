import { z } from "zod";

export const PAYABLE_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  paid: "Paga",
};

export const payableSchema = z.object({
  description: z.string().trim().min(3, "Informe uma descrição"),
  amountReais: z.coerce.number().positive("Valor precisa ser maior que zero"),
  dueDate: z.string().trim().min(1, "Informe a data de vencimento"),
});

export type PayableInput = z.output<typeof payableSchema>;
export type PayableFormInput = z.input<typeof payableSchema>;

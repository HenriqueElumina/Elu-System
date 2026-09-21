import { z } from "zod";

export const timeEntrySchema = z.object({
  workDate: z.string().trim().min(1, "Informe a data"),
  hours: z.coerce.number().positive("Horas precisa ser maior que zero"),
  note: z.string().trim().max(500).optional(),
});

export type TimeEntryInput = z.output<typeof timeEntrySchema>;
export type TimeEntryFormInput = z.input<typeof timeEntrySchema>;

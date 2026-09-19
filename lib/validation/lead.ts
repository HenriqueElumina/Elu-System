import { z } from "zod";

export const LEAD_STATUSES = ["new", "in_negotiation", "won", "lost"] as const;

export const LEAD_STATUS_LABELS: Record<(typeof LEAD_STATUSES)[number], string> = {
  new: "Novo",
  in_negotiation: "Em negociação",
  won: "Ganho",
  lost: "Perdido",
};

export const leadSchema = z.object({
  companyName: z.string().trim().min(2, "Informe o nome da empresa"),
  contactName: z.string().trim().max(150).optional().or(z.literal("")),
  contactEmail: z
    .string()
    .trim()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
});

export type LeadInput = z.output<typeof leadSchema>;
export type LeadFormInput = z.input<typeof leadSchema>;

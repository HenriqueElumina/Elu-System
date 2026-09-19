import { z } from "zod";

export const SERVICE_LINES = [
  "social_media",
  "audiovisual",
  "marketplace",
] as const;

export const SERVICE_LINE_LABELS: Record<(typeof SERVICE_LINES)[number], string> = {
  social_media: "Mídias sociais",
  audiovisual: "Audiovisual",
  marketplace: "Marketplace",
};

export const BILLING_TYPES = ["recurring_monthly", "one_time"] as const;

export const BILLING_TYPE_LABELS: Record<(typeof BILLING_TYPES)[number], string> = {
  recurring_monthly: "Recorrente (mensal)",
  one_time: "Pontual",
};

export const serviceSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome do serviço"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  serviceLine: z.enum(SERVICE_LINES),
  billingType: z.enum(BILLING_TYPES),
  basePriceReais: z.coerce.number().min(0, "Preço não pode ser negativo"),
  active: z.boolean(),
});

export type ServiceInput = z.output<typeof serviceSchema>;
export type ServiceFormInput = z.input<typeof serviceSchema>;

export const playbookStepSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da etapa"),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  slaDays: z.coerce.number().int().min(0).optional(),
});

export type PlaybookStepInput = z.output<typeof playbookStepSchema>;
export type PlaybookStepFormInput = z.input<typeof playbookStepSchema>;

export function centsToReais(cents: number): number {
  return Math.round(cents) / 100;
}

export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

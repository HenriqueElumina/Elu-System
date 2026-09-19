import { z } from "zod";

export const PROPOSAL_STATUSES = [
  "draft",
  "sent",
  "accepted",
  "rejected",
] as const;

export const PROPOSAL_STATUS_LABELS: Record<
  (typeof PROPOSAL_STATUSES)[number],
  string
> = {
  draft: "Rascunho",
  sent: "Enviada",
  accepted: "Aceita",
  rejected: "Recusada",
};

export const proposalItemSchema = z.object({
  serviceId: z.string().trim().min(1, "Escolha um serviço"),
  quantity: z.coerce.number().int().min(1, "Quantidade mínima é 1"),
  unitPriceReais: z.coerce.number().min(0, "Preço não pode ser negativo"),
});

export const proposalSchema = z.object({
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  items: z.array(proposalItemSchema).min(1, "Adicione pelo menos um serviço"),
});

export type ProposalItemInput = z.output<typeof proposalItemSchema>;
export type ProposalInput = z.output<typeof proposalSchema>;
export type ProposalFormInput = z.input<typeof proposalSchema>;

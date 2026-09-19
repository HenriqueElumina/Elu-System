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

// Itens padrão de "serviços não inclusos" do modelo de contrato da
// Elumina. Preço e texto são fixos (ADR 0008); o que varia por contrato é
// só quais desses já estão dentro do escopo vendido (contract.included_extras).
export const STANDARD_EXTRAS = [
  {
    key: "social_media_extra",
    label: "Rede Social adicional",
    priceLabel: "R$ 1.000,00 por mês",
  },
  {
    key: "extra_art",
    label: "Artes digitais extras",
    priceLabel: "R$ 40,00 por arte para web",
  },
  {
    key: "external_capture",
    label: "Captação externa",
    priceLabel: "R$ 2.500,00 por diária",
  },
  {
    key: "still_photos",
    label: "Fotos Still",
    priceLabel: "R$ 100,00 por produto",
  },
] as const;

export type StandardExtraKey = (typeof STANDARD_EXTRAS)[number]["key"];

// Primeiro vencimento: mesmo dia, um mês após a data de início do
// contrato (ex.: contrato em 10/04 -> primeira parcela em 10/05).
export function addOneMonth(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  date.setUTCMonth(date.getUTCMonth() + 1);
  return date.toISOString().slice(0, 10);
}

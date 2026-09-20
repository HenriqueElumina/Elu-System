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
    // Obrigatória (Etapa 1.7): sem data de fim não dá pra calcular quantas
    // parcelas o contrato tem, pra tela de contas a receber.
    endDate: z.string().trim().min(1, "Informe a data de fim"),
  })
  .refine(
    (value) => value.endDate >= value.startDate,
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

// Vencimento da cobrança recorrente (regra do dono do produto, Etapa 1.7):
// contrato registrado do dia 1 ao 15 vence dia 10 do mês seguinte;
// do dia 16 em diante (inclusive dia 31) vence dia 25 do mês seguinte.
// Corrige a regra anterior ("mesmo dia, um mês depois") do ADR 0008.
export function computeFirstDueDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const dueDay = day! <= 15 ? 10 : 25;
  const date = new Date(Date.UTC(year!, month! - 1, 1));
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(dueDay);
  return date.toISOString().slice(0, 10);
}

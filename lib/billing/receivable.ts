export const INVOICE_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  paid: "Paga",
  cancelled: "Cancelada",
};

export type ReceivableSummaryInput = {
  installmentAmountCents: number;
  totalInstallments: number | null;
  paidInstallments: number;
};

export type ReceivableSummary = ReceivableSummaryInput & {
  pendingInstallments: number | null;
  totalAmountCents: number | null;
  remainingAmountCents: number | null;
};

// Contrato sem data de fim (registros antigos, de antes da Etapa 1.7) não
// tem um número de parcelas conhecido -- total e remanescente ficam null
// em vez de um cálculo inventado.
export function computeReceivableSummary(
  input: ReceivableSummaryInput,
): ReceivableSummary {
  const { installmentAmountCents, totalInstallments, paidInstallments } = input;

  if (totalInstallments === null) {
    return {
      ...input,
      pendingInstallments: null,
      totalAmountCents: null,
      remainingAmountCents: null,
    };
  }

  const pendingInstallments = totalInstallments - paidInstallments;

  return {
    ...input,
    pendingInstallments,
    totalAmountCents: installmentAmountCents * totalInstallments,
    remainingAmountCents: installmentAmountCents * pendingInstallments,
  };
}

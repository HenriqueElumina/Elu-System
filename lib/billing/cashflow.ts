export type CashFlowTransaction = {
  id: string;
  description: string;
  amountCents: number;
  date: string;
  kind: "in" | "out";
  bankAccountName: string | null;
};

export type CashFlowSummary = {
  totalInCents: number;
  totalOutCents: number;
  balanceCents: number;
};

export function computeCashFlowSummary(
  transactions: CashFlowTransaction[],
): CashFlowSummary {
  const totalInCents = transactions
    .filter((t) => t.kind === "in")
    .reduce((sum, t) => sum + t.amountCents, 0);
  const totalOutCents = transactions
    .filter((t) => t.kind === "out")
    .reduce((sum, t) => sum + t.amountCents, 0);

  return {
    totalInCents,
    totalOutCents,
    balanceCents: totalInCents - totalOutCents,
  };
}

// Primeiro e último dia do mês (formato "YYYY-MM-DD"), pra filtrar
// lançamentos pagos dentro do período na tela de fluxo de caixa.
export function monthRange(monthStr: string): { start: string; end: string } {
  const [year, month] = monthStr.split("-").map(Number);
  const start = `${monthStr}-01`;
  const lastDay = new Date(Date.UTC(year!, month!, 0)).getUTCDate();
  const end = `${monthStr}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

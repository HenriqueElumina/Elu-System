import { describe, expect, it } from "vitest";
import {
  computeCashFlowSummary,
  monthRange,
  type CashFlowTransaction,
} from "@/lib/billing/cashflow";

describe("computeCashFlowSummary", () => {
  it("soma entradas e saídas e calcula o saldo", () => {
    const transactions: CashFlowTransaction[] = [
      { id: "1", description: "Fatura Cliente A", amountCents: 500_000, date: "2026-09-10", kind: "in", bankAccountName: "Conta principal" },
      { id: "2", description: "Fatura Cliente B", amountCents: 300_000, date: "2026-09-15", kind: "in", bankAccountName: "Conta principal" },
      { id: "3", description: "Aluguel", amountCents: 250_000, date: "2026-09-05", kind: "out", bankAccountName: null },
    ];

    const summary = computeCashFlowSummary(transactions);

    expect(summary.totalInCents).toBe(800_000);
    expect(summary.totalOutCents).toBe(250_000);
    expect(summary.balanceCents).toBe(550_000);
  });

  it("retorna zeros pra lista vazia", () => {
    const summary = computeCashFlowSummary([]);
    expect(summary).toEqual({
      totalInCents: 0,
      totalOutCents: 0,
      balanceCents: 0,
    });
  });

  it("saldo pode ficar negativo (mais saída que entrada)", () => {
    const transactions: CashFlowTransaction[] = [
      { id: "1", description: "Fatura", amountCents: 100_000, date: "2026-09-10", kind: "in", bankAccountName: "Conta principal" },
      { id: "2", description: "Despesa", amountCents: 400_000, date: "2026-09-05", kind: "out", bankAccountName: null },
    ];
    expect(computeCashFlowSummary(transactions).balanceCents).toBe(-300_000);
  });
});

describe("monthRange", () => {
  it("calcula o primeiro e último dia de um mês de 30 dias", () => {
    expect(monthRange("2026-09")).toEqual({ start: "2026-09-01", end: "2026-09-30" });
  });

  it("calcula o último dia de fevereiro corretamente", () => {
    expect(monthRange("2026-02")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
  });

  it("calcula o último dia de um mês de 31 dias", () => {
    expect(monthRange("2026-01")).toEqual({ start: "2026-01-01", end: "2026-01-31" });
  });
});

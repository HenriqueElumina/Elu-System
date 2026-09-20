import { describe, expect, it } from "vitest";
import { computeReceivableSummary } from "@/lib/billing/receivable";

describe("computeReceivableSummary", () => {
  it("calcula total, pendentes e remanescente com base nas parcelas pagas", () => {
    // Exemplo do dono do produto: contrato de 12 meses de R$5.000, 3 pagas.
    const result = computeReceivableSummary({
      installmentAmountCents: 500_000,
      totalInstallments: 12,
      paidInstallments: 3,
    });

    expect(result.pendingInstallments).toBe(9);
    expect(result.totalAmountCents).toBe(6_000_000);
    expect(result.remainingAmountCents).toBe(4_500_000);
  });

  it("zera o remanescente quando todas as parcelas estão pagas", () => {
    const result = computeReceivableSummary({
      installmentAmountCents: 100_000,
      totalInstallments: 6,
      paidInstallments: 6,
    });

    expect(result.pendingInstallments).toBe(0);
    expect(result.remainingAmountCents).toBe(0);
  });

  it("retorna null pro total e remanescente quando o contrato não tem prazo definido", () => {
    const result = computeReceivableSummary({
      installmentAmountCents: 200_000,
      totalInstallments: null,
      paidInstallments: 2,
    });

    expect(result.pendingInstallments).toBeNull();
    expect(result.totalAmountCents).toBeNull();
    expect(result.remainingAmountCents).toBeNull();
  });
});

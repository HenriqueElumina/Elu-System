import { describe, expect, it } from "vitest";
import { computeFirstDueDate, createContractSchema } from "@/lib/validation/contract";

describe("createContractSchema", () => {
  it("rejeita sem data de fim (obrigatória desde a Etapa 1.7)", () => {
    const result = createContractSchema.safeParse({ startDate: "2026-10-01" });
    expect(result.success).toBe(false);
  });

  it("aceita fim depois do início", () => {
    const result = createContractSchema.safeParse({
      startDate: "2026-10-01",
      endDate: "2027-10-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita fim antes do início", () => {
    const result = createContractSchema.safeParse({
      startDate: "2026-10-01",
      endDate: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita sem data de início", () => {
    const result = createContractSchema.safeParse({ startDate: "" });
    expect(result.success).toBe(false);
  });
});

describe("computeFirstDueDate", () => {
  it("contrato do dia 1 ao 15 vence dia 10 do mês seguinte", () => {
    expect(computeFirstDueDate("2026-03-01")).toBe("2026-04-10");
  });

  it("dia 15 conta no primeiro grupo (vence dia 10)", () => {
    expect(computeFirstDueDate("2026-03-15")).toBe("2026-04-10");
  });

  it("dia 16 em diante vence dia 25 do mês seguinte", () => {
    expect(computeFirstDueDate("2026-03-16")).toBe("2026-04-25");
  });

  it("dia 31 conta no segundo grupo (vence dia 25)", () => {
    expect(computeFirstDueDate("2026-03-31")).toBe("2026-04-25");
  });

  it("vira o ano quando necessário", () => {
    expect(computeFirstDueDate("2026-12-20")).toBe("2027-01-25");
  });
});

import { describe, expect, it } from "vitest";
import { addOneMonth, createContractSchema } from "@/lib/validation/contract";

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

describe("addOneMonth", () => {
  it("mesmo dia, mês seguinte", () => {
    expect(addOneMonth("2026-04-10")).toBe("2026-05-10");
  });

  it("vira o ano quando necessário", () => {
    expect(addOneMonth("2026-12-15")).toBe("2027-01-15");
  });

  it("dia 31 em mês seguinte mais curto rola para o próximo mês (limitação conhecida)", () => {
    // Não existe 31/02 -- comportamento padrão do JS Date, documentado
    // aqui para não virar surpresa. Casos assim são raros na prática.
    expect(addOneMonth("2026-01-31")).toBe("2026-03-03");
  });
});

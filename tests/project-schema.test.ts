import { describe, expect, it } from "vitest";
import { editProjectSchema } from "@/lib/validation/project";

describe("editProjectSchema", () => {
  it("aceita nome, status implícito e datas em ordem", () => {
    const result = editProjectSchema.safeParse({
      name: "Loja Teste — Social",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    });
    expect(result.success).toBe(true);
  });

  it("aceita datas nulas", () => {
    const result = editProjectSchema.safeParse({
      name: "Loja Teste — Social",
      startDate: null,
      endDate: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    const result = editProjectSchema.safeParse({
      name: "  ",
      startDate: null,
      endDate: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita data de fim antes da data de início", () => {
    const result = editProjectSchema.safeParse({
      name: "Loja Teste — Social",
      startDate: "2026-06-01",
      endDate: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });
});

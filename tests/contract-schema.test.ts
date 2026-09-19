import { describe, expect, it } from "vitest";
import { createContractSchema } from "@/lib/validation/contract";

describe("createContractSchema", () => {
  it("aceita data de início sozinha", () => {
    const result = createContractSchema.safeParse({ startDate: "2026-10-01" });
    expect(result.success).toBe(true);
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

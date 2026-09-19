import { describe, expect, it } from "vitest";
import { leadSchema } from "@/lib/validation/lead";
import { proposalSchema } from "@/lib/validation/proposal";

describe("leadSchema", () => {
  it("aceita lead com só o nome da empresa", () => {
    const result = leadSchema.safeParse({ companyName: "Maxxi Tacos" });
    expect(result.success).toBe(true);
  });

  it("rejeita nome de empresa muito curto", () => {
    const result = leadSchema.safeParse({ companyName: "M" });
    expect(result.success).toBe(false);
  });

  it("rejeita e-mail de contato inválido", () => {
    const result = leadSchema.safeParse({
      companyName: "Maxxi Tacos",
      contactEmail: "não-é-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("proposalSchema", () => {
  it("aceita proposta com pelo menos um item", () => {
    const result = proposalSchema.safeParse({
      notes: "",
      items: [{ serviceId: "abc", quantity: "1", unitPriceReais: "2500" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejeita proposta sem nenhum item", () => {
    const result = proposalSchema.safeParse({ notes: "", items: [] });
    expect(result.success).toBe(false);
  });

  it("rejeita item com quantidade zero", () => {
    const result = proposalSchema.safeParse({
      items: [{ serviceId: "abc", quantity: "0", unitPriceReais: "100" }],
    });
    expect(result.success).toBe(false);
  });
});

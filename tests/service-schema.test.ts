import { describe, expect, it } from "vitest";
import {
  centsToReais,
  playbookStepSchema,
  reaisToCents,
  serviceSchema,
} from "@/lib/validation/service";

describe("serviceSchema", () => {
  it("aceita um serviço válido", () => {
    const result = serviceSchema.safeParse({
      name: "Gestão de mídias sociais",
      description: "",
      serviceLine: "social_media",
      billingType: "recurring_monthly",
      basePriceReais: "2500.00",
      active: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.basePriceReais).toBe(2500);
    }
  });

  it("rejeita preço negativo", () => {
    const result = serviceSchema.safeParse({
      name: "Serviço qualquer",
      serviceLine: "social_media",
      billingType: "one_time",
      basePriceReais: "-10",
      active: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita nome muito curto", () => {
    const result = serviceSchema.safeParse({
      name: "Ab",
      serviceLine: "social_media",
      billingType: "one_time",
      basePriceReais: "0",
      active: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("playbookStepSchema", () => {
  it("aceita etapa sem SLA", () => {
    const result = playbookStepSchema.safeParse({
      name: "Onboarding",
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita SLA negativo", () => {
    const result = playbookStepSchema.safeParse({
      name: "Onboarding",
      slaDays: "-1",
    });
    expect(result.success).toBe(false);
  });
});

describe("conversão de centavos <-> reais", () => {
  it("converte nos dois sentidos", () => {
    expect(centsToReais(250000)).toBe(2500);
    expect(reaisToCents(2500)).toBe(250000);
    expect(reaisToCents(19.9)).toBe(1990);
  });
});

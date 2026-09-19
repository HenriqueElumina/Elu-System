import { describe, expect, it } from "vitest";
import { clientIntakeSchema } from "@/lib/validation/client-intake";

function baseInput() {
  return {
    legalName: "Cliente Teste LTDA",
    tradeName: "Cliente Teste",
    documentType: "cnpj" as const,
    document: "11.222.333/0001-81",
    email: "contato@clienteteste.com.br",
    phone: "11999998888",
    addressZipCode: "01310-100",
    addressStreet: "Av. Paulista",
    addressNumber: "1000",
    addressComplement: "",
    addressNeighborhood: "Bela Vista",
    addressCity: "São Paulo",
    addressState: "sp",
    primaryContact: {
      name: "Fulano de Tal",
      roleTitle: "Diretor",
      email: "fulano@clienteteste.com.br",
      phone: "11988887777",
    },
    billingSameAsPrimary: true,
    social: {
      instagram: { handle: "@clienteteste", followersCount: 12000 },
    },
  };
}

describe("clientIntakeSchema", () => {
  it("aceita um payload válido com contato financeiro igual ao principal", () => {
    const result = clientIntakeSchema.safeParse(baseInput());
    expect(result.success).toBe(true);
  });

  it("rejeita CNPJ com dígito verificador inválido", () => {
    const result = clientIntakeSchema.safeParse({
      ...baseInput(),
      document: "11.222.333/0001-82",
    });
    expect(result.success).toBe(false);
  });

  it("exige nome e e-mail do contato financeiro quando é diferente do principal", () => {
    const result = clientIntakeSchema.safeParse({
      ...baseInput(),
      billingSameAsPrimary: false,
      billingContact: {},
    });
    expect(result.success).toBe(false);
  });

  it("aceita contato financeiro diferente quando os dados estão completos", () => {
    const result = clientIntakeSchema.safeParse({
      ...baseInput(),
      billingSameAsPrimary: false,
      billingContact: {
        name: "Financeiro Cliente Teste",
        email: "financeiro@clienteteste.com.br",
        phone: "1133334444",
      },
    });
    expect(result.success).toBe(true);
  });
});

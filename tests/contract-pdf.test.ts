import { describe, expect, it } from "vitest";
import { renderContractPdfBase64 } from "@/lib/pdf/render-contract-pdf";
import type { ContractPdfProps } from "@/lib/pdf/contract-document";

function baseProps(): ContractPdfProps {
  return {
    client: {
      legalName: "Cliente Teste LTDA",
      tradeName: "Cliente Teste",
      documentType: "cnpj",
      document: "11.222.333/0001-81",
      addressStreet: "Av. Paulista",
      addressNumber: "1000",
      addressComplement: null,
      addressNeighborhood: "Bela Vista",
      addressCity: "São Paulo",
      addressState: "SP",
      addressZipCode: "01310-100",
      phone: "11999998888",
    },
    clientSignerName: "Fulano de Tal",
    startDate: "2026-10-10",
    endDate: "2027-10-10",
    items: [
      {
        serviceName: "Gestão de mídias sociais",
        serviceDescription: "Planejamento estratégico\nCalendário de postagens",
      },
    ],
    includedExtraKeys: ["external_capture"],
    monthlyTotalCents: 500000,
    firstPaymentDate: "2026-11-10",
  };
}

describe("renderContractPdfBase64", () => {
  it("gera um PDF válido (cabeçalho %PDF) sem lançar erro", async () => {
    const base64 = await renderContractPdfBase64(baseProps());
    expect(base64.length).toBeGreaterThan(1000);
    const header = Buffer.from(base64, "base64").subarray(0, 5).toString("ascii");
    expect(header).toBe("%PDF-");
  });

  it("funciona sem itens de 'não inclusos' restantes (todos marcados como já inclusos)", async () => {
    const props = baseProps();
    props.includedExtraKeys = [
      "social_media_extra",
      "extra_art",
      "external_capture",
      "still_photos",
    ];
    const base64 = await renderContractPdfBase64(props);
    expect(base64.length).toBeGreaterThan(1000);
  });
});

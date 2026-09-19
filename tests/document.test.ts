import { describe, expect, it } from "vitest";
import { isValidCNPJ, isValidCPF, isValidDocument } from "@/lib/validation/document";

describe("isValidCPF", () => {
  it("aceita CPF válido, com ou sem máscara", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
    expect(isValidCPF("52998224725")).toBe(true);
  });

  it("rejeita CPF com dígito verificador errado", () => {
    expect(isValidCPF("529.982.247-26")).toBe(false);
  });

  it("rejeita CPF com todos os dígitos iguais", () => {
    expect(isValidCPF("111.111.111-11")).toBe(false);
  });

  it("rejeita tamanho errado", () => {
    expect(isValidCPF("123")).toBe(false);
  });
});

describe("isValidCNPJ", () => {
  it("aceita CNPJ válido, com ou sem máscara", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true);
    expect(isValidCNPJ("11222333000181")).toBe(true);
  });

  it("rejeita CNPJ com dígito verificador errado", () => {
    expect(isValidCNPJ("11.222.333/0001-82")).toBe(false);
  });

  it("rejeita CNPJ com todos os dígitos iguais", () => {
    expect(isValidCNPJ("11.111.111/1111-11")).toBe(false);
  });

  it("rejeita tamanho errado", () => {
    expect(isValidCNPJ("123")).toBe(false);
  });
});

describe("isValidDocument", () => {
  it("valida de acordo com o tipo informado", () => {
    expect(isValidDocument("52998224725", "cpf")).toBe(true);
    expect(isValidDocument("52998224725", "cnpj")).toBe(false);
    expect(isValidDocument("11222333000181", "cnpj")).toBe(true);
  });
});

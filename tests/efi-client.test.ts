import { describe, expect, it } from "vitest";
import { sanitizePhoneNumber } from "@/lib/efi/client";

describe("sanitizePhoneNumber", () => {
  it("aceita número já limpo", () => {
    expect(sanitizePhoneNumber("11988887777")).toBe("11988887777");
  });

  it("remove parênteses, espaço e traço", () => {
    expect(sanitizePhoneNumber("(11) 98888-7777")).toBe("11988887777");
  });

  it("remove o código do país (+55)", () => {
    expect(sanitizePhoneNumber("+55 11 98888-7777")).toBe("11988887777");
  });

  it("aceita fixo (sem o 9 extra)", () => {
    expect(sanitizePhoneNumber("1133334444")).toBe("1133334444");
  });

  it("retorna undefined quando não sobra nada", () => {
    expect(sanitizePhoneNumber(null)).toBeUndefined();
    expect(sanitizePhoneNumber("")).toBeUndefined();
  });

  it("retorna undefined quando o número não bate com o formato esperado", () => {
    expect(sanitizePhoneNumber("123")).toBeUndefined();
  });
});

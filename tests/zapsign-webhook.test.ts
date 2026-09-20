import { describe, expect, it } from "vitest";
import { extractDocToken } from "@/lib/zapsign/webhook";

describe("extractDocToken", () => {
  it("lê token no nível raiz do corpo", () => {
    expect(extractDocToken({ token: "abc123" })).toBe("abc123");
  });

  it("lê token dentro de doc.token", () => {
    expect(extractDocToken({ doc: { token: "def456" } })).toBe("def456");
  });

  it("lê token dentro de data.token", () => {
    expect(extractDocToken({ data: { token: "ghi789" } })).toBe("ghi789");
  });

  it("retorna null quando não encontra token em lugar nenhum", () => {
    expect(extractDocToken({ status: "signed" })).toBeNull();
    expect(extractDocToken(null)).toBeNull();
    expect(extractDocToken("string qualquer")).toBeNull();
  });
});

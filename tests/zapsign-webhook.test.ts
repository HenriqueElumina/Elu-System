import { describe, expect, it } from "vitest";
import { extractDocToken, isAuthorizedWebhook } from "@/lib/zapsign/webhook";

describe("isAuthorizedWebhook", () => {
  it("aceita quando o cabeçalho bate com o segredo configurado", () => {
    expect(isAuthorizedWebhook("segredo-123", "segredo-123")).toBe(true);
  });

  it("rejeita quando o cabeçalho não bate", () => {
    expect(isAuthorizedWebhook("errado", "segredo-123")).toBe(false);
  });

  it("rejeita quando falta o cabeçalho", () => {
    expect(isAuthorizedWebhook(null, "segredo-123")).toBe(false);
  });

  it("rejeita quando o segredo não está configurado no servidor", () => {
    expect(isAuthorizedWebhook("qualquer-coisa", undefined)).toBe(false);
  });
});

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

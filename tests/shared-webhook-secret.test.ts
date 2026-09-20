import { describe, expect, it } from "vitest";
import { isAuthorizedWebhook } from "@/lib/webhooks/shared-secret";

describe("isAuthorizedWebhook", () => {
  it("aceita quando o valor bate com o segredo configurado", () => {
    expect(isAuthorizedWebhook("segredo-123", "segredo-123")).toBe(true);
  });

  it("rejeita quando o valor não bate", () => {
    expect(isAuthorizedWebhook("errado", "segredo-123")).toBe(false);
  });

  it("rejeita quando falta o valor", () => {
    expect(isAuthorizedWebhook(null, "segredo-123")).toBe(false);
  });

  it("rejeita quando o segredo não está configurado no servidor", () => {
    expect(isAuthorizedWebhook("qualquer-coisa", undefined)).toBe(false);
  });
});

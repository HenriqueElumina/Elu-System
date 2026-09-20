import { describe, expect, it } from "vitest";
import { extractNotificationToken } from "@/lib/efi/webhook";

describe("extractNotificationToken", () => {
  it("lê o token no campo notification", () => {
    expect(extractNotificationToken({ notification: "abc123" })).toBe(
      "abc123",
    );
  });

  it("lê o token no campo token, se notification não vier", () => {
    expect(extractNotificationToken({ token: "def456" })).toBe("def456");
  });

  it("retorna null quando não encontra token em lugar nenhum", () => {
    expect(extractNotificationToken({ status: "paid" })).toBeNull();
    expect(extractNotificationToken(null)).toBeNull();
    expect(extractNotificationToken("string qualquer")).toBeNull();
  });
});

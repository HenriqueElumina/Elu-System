import { describe, expect, it } from "vitest";
import {
  createClientUserInviteSchema,
  completeClientUserSignupSchema,
  requestContentDemandChangesSchema,
} from "@/lib/validation/client-user";

describe("createClientUserInviteSchema", () => {
  it("aceita e-mail válido", () => {
    const result = createClientUserInviteSchema.safeParse({
      email: "contato@cliente.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    const result = createClientUserInviteSchema.safeParse({ email: "não é e-mail" });
    expect(result.success).toBe(false);
  });
});

describe("completeClientUserSignupSchema", () => {
  it("aceita nome e senha válidos", () => {
    const result = completeClientUserSignupSchema.safeParse({
      fullName: "Maria Silva",
      password: "senha1234",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita senha curta", () => {
    const result = completeClientUserSignupSchema.safeParse({
      fullName: "Maria Silva",
      password: "1234567",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita nome vazio", () => {
    const result = completeClientUserSignupSchema.safeParse({
      fullName: "",
      password: "senha1234",
    });
    expect(result.success).toBe(false);
  });
});

describe("requestContentDemandChangesSchema", () => {
  it("aceita observação preenchida", () => {
    const result = requestContentDemandChangesSchema.safeParse({
      note: "Trocar a cor de fundo",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita observação vazia", () => {
    const result = requestContentDemandChangesSchema.safeParse({ note: "" });
    expect(result.success).toBe(false);
  });

  it("rejeita observação só com espaços", () => {
    const result = requestContentDemandChangesSchema.safeParse({ note: "   " });
    expect(result.success).toBe(false);
  });
});

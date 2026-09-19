import { describe, expect, it } from "vitest";
import { isInternalRole } from "@/lib/auth/roles";

describe("isInternalRole", () => {
  it.each(["socio", "financeiro", "gestor", "colaborador"])(
    "considera %s um perfil interno",
    (role) => {
      expect(isInternalRole(role)).toBe(true);
    },
  );

  it.each(["freelancer", "cliente"])(
    "não considera %s um perfil interno no MVP da Onda 1",
    (role) => {
      expect(isInternalRole(role)).toBe(false);
    },
  );

  it("retorna false para role nulo, indefinido ou desconhecido", () => {
    expect(isInternalRole(null)).toBe(false);
    expect(isInternalRole(undefined)).toBe(false);
    expect(isInternalRole("role-que-nao-existe")).toBe(false);
  });
});

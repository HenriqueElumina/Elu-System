import { describe, expect, it } from "vitest";
import { navLinksForRole } from "@/lib/nav/links";

describe("navLinksForRole", () => {
  it("sócio vê todos os módulos", () => {
    const hrefs = navLinksForRole("socio").map((link) => link.href);
    expect(hrefs).toEqual([
      "/clientes",
      "/servicos",
      "/leads",
      "/contratos",
      "/financeiro",
      "/projetos",
      "/colaboradores",
    ]);
  });

  it("colaborador não vê Leads, Contratos nem Financeiro", () => {
    const hrefs = navLinksForRole("colaborador").map((link) => link.href);
    expect(hrefs).not.toContain("/leads");
    expect(hrefs).not.toContain("/contratos");
    expect(hrefs).not.toContain("/financeiro");
    expect(hrefs).toContain("/clientes");
    expect(hrefs).toContain("/projetos");
    expect(hrefs).toContain("/colaboradores");
  });

  it("financeiro não vê Projetos", () => {
    const hrefs = navLinksForRole("financeiro").map((link) => link.href);
    expect(hrefs).not.toContain("/projetos");
    expect(hrefs).toContain("/financeiro");
  });

  it("marca linha divisória antes de Leads e Projetos, só pra separação visual", () => {
    const breaks = navLinksForRole("socio")
      .filter((link) => link.groupBreakBefore)
      .map((link) => link.href);
    expect(breaks).toEqual(["/leads", "/projetos"]);
  });
});

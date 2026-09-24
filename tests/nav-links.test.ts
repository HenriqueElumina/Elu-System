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

  it("Financeiro tem as 4 subcategorias, na ordem certa", () => {
    const financeiro = navLinksForRole("socio").find(
      (link) => link.href === "/financeiro",
    );
    expect(financeiro?.children?.map((child) => child.href)).toEqual([
      "/financeiro",
      "/financeiro/contas-a-pagar",
      "/financeiro/fluxo-de-caixa",
      "/financeiro/contas-bancarias",
    ]);
  });

  it("Projetos tem as 2 subcategorias, na ordem certa", () => {
    const projetos = navLinksForRole("socio").find(
      (link) => link.href === "/projetos",
    );
    expect(projetos?.children?.map((child) => child.href)).toEqual([
      "/projetos",
      "/projetos/workflow",
    ]);
  });

  it("nenhum outro módulo tem subcategorias", () => {
    const others = navLinksForRole("socio").filter(
      (link) => link.href !== "/financeiro" && link.href !== "/projetos",
    );
    expect(others.every((link) => !link.children)).toBe(true);
  });
});

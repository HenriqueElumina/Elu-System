import type { UserRole } from "@/lib/auth/roles";

export type NavSubLink = {
  href: string;
  label: string;
};

export type NavLink = {
  href: string;
  label: string;
  roles: readonly UserRole[];
  // Subcategorias mostradas indentadas embaixo do item, só quando você
  // está em alguma tela dentro dele (ver AppShell).
  children?: readonly NavSubLink[];
};

// Espelha as checagens de perfil feitas em cada app/*/page.tsx — se uma
// tela mudar quem pode acessá-la, atualize aqui também.
export const NAV_LINKS: readonly NavLink[] = [
  {
    href: "/clientes",
    label: "Clientes",
    roles: ["socio", "financeiro", "gestor", "colaborador"],
  },
  {
    href: "/servicos",
    label: "Serviços",
    roles: ["socio", "financeiro", "gestor", "colaborador"],
  },
  {
    href: "/leads",
    label: "Leads",
    roles: ["socio", "financeiro", "gestor"],
  },
  {
    href: "/contratos",
    label: "Contratos",
    roles: ["socio", "financeiro", "gestor"],
  },
  {
    href: "/financeiro",
    label: "Financeiro",
    roles: ["socio", "financeiro", "gestor"],
    children: [
      { href: "/financeiro", label: "Contas a receber" },
      { href: "/financeiro/contas-a-pagar", label: "Contas a pagar" },
      { href: "/financeiro/fluxo-de-caixa", label: "Fluxo de caixa" },
      { href: "/financeiro/contas-bancarias", label: "Contas bancárias" },
    ],
  },
  {
    href: "/projetos",
    label: "Projetos",
    roles: ["socio", "gestor", "colaborador"],
  },
  {
    href: "/colaboradores",
    label: "Colaboradores",
    roles: ["socio", "financeiro", "gestor", "colaborador"],
  },
];

export function navLinksForRole(role: UserRole): readonly NavLink[] {
  return NAV_LINKS.filter((link) => link.roles.includes(role));
}

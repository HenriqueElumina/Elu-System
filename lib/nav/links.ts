import type { UserRole } from "@/lib/auth/roles";

export type NavLink = {
  href: string;
  label: string;
  roles: readonly UserRole[];
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

import type { UserRole } from "@/lib/auth/roles";

export type NavLink = {
  href: string;
  label: string;
  roles: readonly UserRole[];
  // Linha divisória antes deste item, só pra separação visual — não é
  // uma categoria com nome, só agrupa o que já existe.
  groupBreakBefore?: boolean;
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
    groupBreakBefore: true,
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
    groupBreakBefore: true,
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

export type UserRole =
  | "socio"
  | "financeiro"
  | "gestor"
  | "colaborador"
  | "freelancer"
  | "cliente";

// MVP da Onda 1 (docs/00-visao.md): freelancer e cliente ainda não têm
// telas internas -- só socio/financeiro/gestor/colaborador acessam o app.
const INTERNAL_ROLES: readonly UserRole[] = [
  "socio",
  "financeiro",
  "gestor",
  "colaborador",
];

export function isInternalRole(role: string | null | undefined): boolean {
  return !!role && (INTERNAL_ROLES as readonly string[]).includes(role);
}

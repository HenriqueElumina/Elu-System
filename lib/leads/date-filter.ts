export const LEAD_DAY_FILTERS = [30, 60, 90] as const;
export type LeadDayFilter = (typeof LEAD_DAY_FILTERS)[number];

export function parseLeadDayFilter(value: string | undefined): LeadDayFilter | null {
  const parsed = Number(value);
  return (LEAD_DAY_FILTERS as readonly number[]).includes(parsed)
    ? (parsed as LeadDayFilter)
    : null;
}

// Corte pro filtro "criados nos últimos N dias" — null significa sem filtro.
export function createdAfterCutoff(
  days: LeadDayFilter | null,
  now: Date = new Date(),
): string | null {
  if (days === null) return null;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

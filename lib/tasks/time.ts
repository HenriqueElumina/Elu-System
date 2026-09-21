export function sumLoggedHours(entries: { hours: number }[]): number {
  return entries.reduce((sum, entry) => sum + entry.hours, 0);
}

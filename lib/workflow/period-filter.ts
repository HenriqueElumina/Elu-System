export const WORKFLOW_PERIOD_PRESETS = [
  "hoje",
  "semana",
  "mes",
  "personalizado",
] as const;
export type WorkflowPeriodPreset = (typeof WORKFLOW_PERIOD_PRESETS)[number];

export function parseWorkflowPeriodPreset(
  value: string | undefined,
): WorkflowPeriodPreset | null {
  return (WORKFLOW_PERIOD_PRESETS as readonly string[]).includes(value ?? "")
    ? (value as WorkflowPeriodPreset)
    : null;
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Início e fim (strings "YYYY-MM-DD", inclusive) do período selecionado,
// pra filtrar scheduled_at. null = sem filtro de período (mostra tudo).
// "personalizado" só filtra quando os dois campos vêm preenchidos —
// incompleto é tratado como sem filtro, pra não esconder tudo sem querer.
export function resolveWorkflowPeriod(
  preset: WorkflowPeriodPreset | null,
  customFrom: string | undefined,
  customTo: string | undefined,
  now: Date = new Date(),
): { from: string; to: string } | null {
  if (preset === null) return null;

  if (preset === "hoje") {
    const today = toDateStr(now);
    return { from: today, to: today };
  }

  if (preset === "semana") {
    const day = now.getUTCDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    return { from: toDateStr(monday), to: toDateStr(sunday) };
  }

  if (preset === "mes") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
    return { from: toDateStr(start), to: toDateStr(end) };
  }

  if (!customFrom || !customTo) return null;
  return { from: customFrom, to: customTo };
}

// Ordena por data prevista de publicação, mais próxima primeiro — sem
// data fica sempre no fim (mesma regra já usada nas tarefas do projeto).
export function sortByScheduledAt<T extends { scheduled_at: string | null }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    if (!a.scheduled_at && !b.scheduled_at) return 0;
    if (!a.scheduled_at) return 1;
    if (!b.scheduled_at) return -1;
    return a.scheduled_at.localeCompare(b.scheduled_at);
  });
}

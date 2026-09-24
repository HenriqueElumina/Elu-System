import { describe, expect, it } from "vitest";
import {
  parseWorkflowPeriodPreset,
  resolveWorkflowPeriod,
  sortByScheduledAt,
} from "@/lib/workflow/period-filter";

describe("parseWorkflowPeriodPreset", () => {
  it("aceita só os presets válidos", () => {
    expect(parseWorkflowPeriodPreset("hoje")).toBe("hoje");
    expect(parseWorkflowPeriodPreset("semana")).toBe("semana");
    expect(parseWorkflowPeriodPreset("mes")).toBe("mes");
    expect(parseWorkflowPeriodPreset("personalizado")).toBe("personalizado");
  });

  it("retorna null pra vazio, indefinido ou lixo", () => {
    expect(parseWorkflowPeriodPreset(undefined)).toBeNull();
    expect(parseWorkflowPeriodPreset("")).toBeNull();
    expect(parseWorkflowPeriodPreset("qualquer-coisa")).toBeNull();
  });
});

describe("resolveWorkflowPeriod", () => {
  // Quarta-feira, 24/09/2026.
  const now = new Date("2026-09-24T15:00:00Z");

  it("sem preset, não filtra", () => {
    expect(resolveWorkflowPeriod(null, undefined, undefined, now)).toBeNull();
  });

  it("hoje: só o dia atual", () => {
    expect(resolveWorkflowPeriod("hoje", undefined, undefined, now)).toEqual({
      from: "2026-09-24",
      to: "2026-09-24",
    });
  });

  it("semana: segunda a domingo da semana atual", () => {
    expect(resolveWorkflowPeriod("semana", undefined, undefined, now)).toEqual(
      { from: "2026-09-21", to: "2026-09-27" },
    );
  });

  it("semana: funciona também caindo num domingo", () => {
    const sunday = new Date("2026-09-27T10:00:00Z");
    expect(resolveWorkflowPeriod("semana", undefined, undefined, sunday)).toEqual(
      { from: "2026-09-21", to: "2026-09-27" },
    );
  });

  it("mes: primeiro ao último dia do mês atual", () => {
    expect(resolveWorkflowPeriod("mes", undefined, undefined, now)).toEqual({
      from: "2026-09-01",
      to: "2026-09-30",
    });
  });

  it("personalizado: usa de/até quando os dois vêm preenchidos", () => {
    expect(
      resolveWorkflowPeriod("personalizado", "2026-10-01", "2026-10-15", now),
    ).toEqual({ from: "2026-10-01", to: "2026-10-15" });
  });

  it("personalizado incompleto não filtra", () => {
    expect(
      resolveWorkflowPeriod("personalizado", "2026-10-01", undefined, now),
    ).toBeNull();
    expect(
      resolveWorkflowPeriod("personalizado", undefined, undefined, now),
    ).toBeNull();
  });
});

describe("sortByScheduledAt", () => {
  it("ordena por data prevista, mais próxima primeiro", () => {
    const items = [
      { id: "b", scheduled_at: "2026-10-05T10:00:00Z" },
      { id: "a", scheduled_at: "2026-10-01T10:00:00Z" },
      { id: "c", scheduled_at: "2026-10-20T10:00:00Z" },
    ];
    expect(sortByScheduledAt(items).map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("deixa itens sem data no fim, sem mudar a ordem original entre eles", () => {
    const items = [
      { id: "sem-data-1", scheduled_at: null },
      { id: "com-data", scheduled_at: "2026-10-01T10:00:00Z" },
      { id: "sem-data-2", scheduled_at: null },
    ];
    expect(sortByScheduledAt(items).map((i) => i.id)).toEqual([
      "com-data",
      "sem-data-1",
      "sem-data-2",
    ]);
  });

  it("não modifica o array original", () => {
    const items = [
      { id: "b", scheduled_at: "2026-10-05T10:00:00Z" },
      { id: "a", scheduled_at: "2026-10-01T10:00:00Z" },
    ];
    sortByScheduledAt(items);
    expect(items.map((i) => i.id)).toEqual(["b", "a"]);
  });
});

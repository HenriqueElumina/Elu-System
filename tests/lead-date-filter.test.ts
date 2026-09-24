import { describe, expect, it } from "vitest";
import { createdAfterCutoff, parseLeadDayFilter } from "@/lib/leads/date-filter";

describe("parseLeadDayFilter", () => {
  it("aceita 30, 60 e 90", () => {
    expect(parseLeadDayFilter("30")).toBe(30);
    expect(parseLeadDayFilter("60")).toBe(60);
    expect(parseLeadDayFilter("90")).toBe(90);
  });

  it("qualquer outro valor (ou ausente) vira sem filtro", () => {
    expect(parseLeadDayFilter("45")).toBeNull();
    expect(parseLeadDayFilter("")).toBeNull();
    expect(parseLeadDayFilter(undefined)).toBeNull();
  });
});

describe("createdAfterCutoff", () => {
  const now = new Date("2026-10-10T12:00:00.000Z");

  it("sem filtro devolve null", () => {
    expect(createdAfterCutoff(null, now)).toBeNull();
  });

  it("30 dias devolve o corte certo", () => {
    expect(createdAfterCutoff(30, now)).toBe("2026-09-10T12:00:00.000Z");
  });

  it("90 dias devolve o corte certo", () => {
    expect(createdAfterCutoff(90, now)).toBe("2026-07-12T12:00:00.000Z");
  });
});

import { describe, expect, it } from "vitest";
import { sumLoggedHours } from "@/lib/tasks/time";

describe("sumLoggedHours", () => {
  it("soma as horas de vários lançamentos", () => {
    expect(sumLoggedHours([{ hours: 2.5 }, { hours: 1 }, { hours: 0.5 }])).toBe(4);
  });

  it("retorna 0 pra lista vazia", () => {
    expect(sumLoggedHours([])).toBe(0);
  });
});

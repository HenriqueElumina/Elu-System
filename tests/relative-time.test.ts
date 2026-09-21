import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "@/lib/format/relative-time";

const now = new Date("2026-10-01T12:00:00Z");

describe("formatRelativeTime", () => {
  it("menos de 1 minuto vira 'agora mesmo'", () => {
    expect(formatRelativeTime(new Date("2026-10-01T11:59:30Z"), now)).toBe("agora mesmo");
  });

  it("minutos", () => {
    expect(formatRelativeTime(new Date("2026-10-01T11:45:00Z"), now)).toBe("há 15 min");
  });

  it("horas", () => {
    expect(formatRelativeTime(new Date("2026-10-01T09:00:00Z"), now)).toBe("há 3h");
  });

  it("1 dia (singular)", () => {
    expect(formatRelativeTime(new Date("2026-09-30T12:00:00Z"), now)).toBe("há 1 dia");
  });

  it("vários dias", () => {
    expect(formatRelativeTime(new Date("2026-09-25T12:00:00Z"), now)).toBe("há 6 dias");
  });

  it("meses", () => {
    expect(formatRelativeTime(new Date("2026-07-01T12:00:00Z"), now)).toBe("há 3 meses");
  });
});

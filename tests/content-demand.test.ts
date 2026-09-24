import { describe, expect, it } from "vitest";
import { parseTags } from "@/lib/validation/content-demand";

describe("parseTags", () => {
  it("separa por vírgula e tira espaço em volta", () => {
    expect(parseTags("promo, lançamento ,  black friday")).toEqual([
      "promo",
      "lançamento",
      "black friday",
    ]);
  });

  it("ignora entradas vazias e undefined", () => {
    expect(parseTags("")).toEqual([]);
    expect(parseTags(undefined)).toEqual([]);
    expect(parseTags("promo,,lançamento")).toEqual(["promo", "lançamento"]);
  });
});

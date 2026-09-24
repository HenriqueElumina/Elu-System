import { describe, expect, it } from "vitest";
import { resolveMediaPreview } from "@/lib/workflow/media-preview";

describe("resolveMediaPreview", () => {
  it("sem link, não tem preview", () => {
    expect(resolveMediaPreview(null)).toEqual({ kind: "none" });
    expect(resolveMediaPreview(undefined)).toEqual({ kind: "none" });
    expect(resolveMediaPreview("")).toEqual({ kind: "none" });
  });

  it("link inválido (não parseável como URL), não tem preview", () => {
    expect(resolveMediaPreview("não é um link")).toEqual({ kind: "none" });
  });

  it("link de imagem direta vira preview de imagem", () => {
    expect(resolveMediaPreview("https://cdn.exemplo.com/foto.jpg")).toEqual({
      kind: "image",
      url: "https://cdn.exemplo.com/foto.jpg",
    });
  });

  it("extensão de imagem é reconhecida sem diferenciar maiúsculas", () => {
    expect(resolveMediaPreview("https://cdn.exemplo.com/foto.PNG")).toEqual({
      kind: "image",
      url: "https://cdn.exemplo.com/foto.PNG",
    });
  });

  it("link do Drive no formato /file/d/ID/view vira embed de preview", () => {
    expect(
      resolveMediaPreview(
        "https://drive.google.com/file/d/1AbCDefGHI23/view?usp=sharing",
      ),
    ).toEqual({
      kind: "drive",
      embedUrl: "https://drive.google.com/file/d/1AbCDefGHI23/preview",
    });
  });

  it("link do Drive no formato /open?id=ID vira embed de preview", () => {
    expect(
      resolveMediaPreview("https://drive.google.com/open?id=1AbCDefGHI23"),
    ).toEqual({
      kind: "drive",
      embedUrl: "https://drive.google.com/file/d/1AbCDefGHI23/preview",
    });
  });

  it("link do Drive sem id reconhecível não tem preview", () => {
    expect(resolveMediaPreview("https://drive.google.com/drive/my-drive")).toEqual(
      { kind: "none" },
    );
  });

  it("qualquer outro link (ex.: Dropbox, vídeo) continua sem preview", () => {
    expect(
      resolveMediaPreview("https://www.dropbox.com/s/xyz/video.mp4"),
    ).toEqual({ kind: "none" });
  });
});

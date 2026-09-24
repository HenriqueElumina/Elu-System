export type MediaPreview =
  | { kind: "image"; url: string }
  | { kind: "drive"; embedUrl: string }
  | { kind: "none" };

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"];

// Reconhece link de imagem direta ou de arquivo do Google Drive
// (compartilhado como "qualquer pessoa com o link pode visualizar") pra
// mostrar uma pré-visualização na tela de aprovação. Qualquer outro link
// cai em "none" e continua só como link clicável — não quebra nada.
export function resolveMediaPreview(
  url: string | null | undefined,
): MediaPreview {
  if (!url) return { kind: "none" };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { kind: "none" };
  }

  const lowerPath = parsed.pathname.toLowerCase();
  if (IMAGE_EXTENSIONS.some((ext) => lowerPath.endsWith(ext))) {
    return { kind: "image", url };
  }

  if (parsed.hostname === "drive.google.com") {
    const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
    const fileId = fileMatch?.[1] ?? parsed.searchParams.get("id");
    if (fileId) {
      return {
        kind: "drive",
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      };
    }
  }

  return { kind: "none" };
}

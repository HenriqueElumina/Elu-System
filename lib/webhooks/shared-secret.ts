import { timingSafeEqual } from "crypto";

// Usado por todo webhook cujo provedor não tem campo de cabeçalho
// customizado no cadastro (ZapSign, Etapa 1.5; Efí, Etapa 1.8) -- o
// segredo vai na própria URL, comparado aqui em tempo constante.
export function isAuthorizedWebhook(
  headerValue: string | null,
  expectedSecret: string | undefined,
): boolean {
  if (!expectedSecret || !headerValue) return false;

  const a = Buffer.from(headerValue);
  const b = Buffer.from(expectedSecret);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

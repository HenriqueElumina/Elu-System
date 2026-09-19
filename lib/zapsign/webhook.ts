import { timingSafeEqual } from "crypto";

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

export function extractDocToken(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;

  const candidates = [
    record.token,
    (record.doc as Record<string, unknown> | undefined)?.token,
    (record.data as Record<string, unknown> | undefined)?.token,
  ];

  const token = candidates.find((value) => typeof value === "string");
  return (token as string | undefined) ?? null;
}

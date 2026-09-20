export { isAuthorizedWebhook } from "@/lib/webhooks/shared-secret";

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

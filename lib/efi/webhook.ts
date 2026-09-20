// A notificação da Efí não traz o status da cobrança direto no corpo --
// traz um token que precisa ser resolvido via GET /v1/notification/:token
// pra descobrir quais cobranças mudaram (lib/efi/client.ts,
// resolveNotification). Mesmo espírito defensivo do ZapSign
// (extractDocToken): tenta os nomes de campo mais prováveis em vez de
// travar num só, já que não consegui confirmar contra a API real ainda.
export function extractNotificationToken(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;

  const candidates = [record.notification, record.token];
  const token = candidates.find((value) => typeof value === "string");
  return (token as string | undefined) ?? null;
}

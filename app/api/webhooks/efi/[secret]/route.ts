import { createClient } from "@supabase/supabase-js";
import { getCharge, resolveNotification } from "@/lib/efi/client";
import { extractNotificationToken } from "@/lib/efi/webhook";
import { isAuthorizedWebhook } from "@/lib/webhooks/shared-secret";

// Segredo na própria URL, mesmo padrão do webhook do ZapSign (Etapa 1.5)
// -- não depende de decifrar certo o esquema de assinatura da Efí pra
// ter segurança real.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ secret: string }> },
) {
  const { secret } = await params;
  if (!isAuthorizedWebhook(secret, process.env.EFI_WEBHOOK_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const notificationToken = extractNotificationToken(body);

  if (!notificationToken) {
    console.error("efi webhook: corpo sem token de notificação", body);
    return new Response("Bad request", { status: 400 });
  }

  let chargeIds: string[];
  try {
    chargeIds = await resolveNotification(notificationToken);
  } catch (err) {
    console.error("efi webhook: erro ao resolver notificação", err);
    return new Response("Erro ao resolver notificação", { status: 502 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Nunca confia no status batido pela notificação -- reconsulta cada
  // cobrança na API antes de atualizar (mesma defesa do webhook do
  // ZapSign, onde o evento também não reflete o estado final sozinho).
  for (const chargeId of chargeIds) {
    let charge;
    try {
      charge = await getCharge(chargeId);
    } catch (err) {
      console.error("efi webhook: erro ao consultar cobrança", chargeId, err);
      continue;
    }

    const { error } = await supabase.rpc("update_invoice_payment_status", {
      p_external_charge_id: String(charge.charge_id),
      p_status: charge.status,
      p_paid_at: charge.status === "paid" ? new Date().toISOString() : null,
    });

    if (error) {
      console.error("efi webhook: erro ao atualizar fatura", chargeId, error);
    }
  }

  return new Response("OK", { status: 200 });
}

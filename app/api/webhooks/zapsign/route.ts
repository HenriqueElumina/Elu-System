import { createClient } from "@supabase/supabase-js";
import { getDocument } from "@/lib/zapsign/client";
import { extractDocToken, isAuthorizedWebhook } from "@/lib/zapsign/webhook";

const WEBHOOK_HEADER = "x-elu-webhook-secret";

export async function POST(request: Request) {
  const header = request.headers.get(WEBHOOK_HEADER);
  if (!isAuthorizedWebhook(header, process.env.ZAPSIGN_WEBHOOK_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const token = extractDocToken(body);

  if (!token) {
    console.error("zapsign webhook: corpo sem token de documento", body);
    return new Response("Bad request", { status: 400 });
  }

  // Não confia cegamente no corpo do webhook (doc_signed dispara por
  // signatário, não pelo documento inteiro) -- reconsulta a API do
  // ZapSign pra saber o status real e atualizado do documento.
  let doc;
  try {
    doc = await getDocument(token);
  } catch (err) {
    console.error("zapsign webhook: erro ao consultar documento", err);
    return new Response("Erro ao consultar ZapSign", { status: 502 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { error } = await supabase.rpc("update_contract_signature_status", {
    p_external_signature_id: doc.token,
    p_signature_status: doc.status,
    p_signed_at: doc.status === "signed" ? new Date().toISOString() : null,
  });

  if (error) {
    console.error("zapsign webhook: erro ao atualizar contrato", error);
    return new Response("Erro ao atualizar contrato", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}

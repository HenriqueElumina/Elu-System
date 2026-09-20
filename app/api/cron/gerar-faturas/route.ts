import { createClient } from "@supabase/supabase-js";

// Vercel Cron chama esta rota 1x/dia (vercel.json) mandando
// `Authorization: Bearer $CRON_SECRET` automaticamente -- é o jeito
// oficial de confirmar que a chamada é da Vercel, não de qualquer um.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { error } = await supabase.rpc("generate_due_invoices");

  if (error) {
    console.error("cron gerar-faturas: erro", error);
    return new Response("Erro ao gerar faturas", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}

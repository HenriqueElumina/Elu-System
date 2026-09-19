import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // /api fica de fora: rotas de API (como o webhook do ZapSign) cuidam da
    // própria autenticação e não têm sessão de usuário do Supabase -- esse
    // middleware redirecionava chamadas sem sessão pra /login, que não
    // aceita POST, e isso virava 405 pro ZapSign.
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

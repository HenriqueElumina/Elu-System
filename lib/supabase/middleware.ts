import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname.startsWith("/login");
  // /convite/[token] e /convite-colaborador/[token]: páginas públicas que
  // cliente/colaborador preenchem sem login. /redefinir-senha: chega com
  // um código de recuperação, também antes de ter sessão.
  const isPublicPage =
    isLoginPage ||
    request.nextUrl.pathname.startsWith("/convite") ||
    request.nextUrl.pathname.startsWith("/redefinir-senha");

  if (!user && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Perfil desativado (Etapa 9.3): auth_role() já bloqueia tudo via RLS,
  // mas sem isso a pessoa cai numa tela quebrada em vez de um aviso claro.
  if (user && !isPublicPage) {
    const { data: profile } = await supabase
      .from("profile")
      .select("active")
      .eq("id", user.id)
      .single();

    if (profile && !profile.active) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("desativado", "1");
      return NextResponse.redirect(url);
    }
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/clientes";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

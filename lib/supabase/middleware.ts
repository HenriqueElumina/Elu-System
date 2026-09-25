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
  // /convite/[token], /convite-colaborador/[token] e /convite-cliente/[token]:
  // páginas públicas que cliente/colaborador preenchem sem login.
  // /redefinir-senha: chega com um código de recuperação, também antes de
  // ter sessão.
  const isPublicPage =
    isLoginPage ||
    request.nextUrl.pathname.startsWith("/convite") ||
    request.nextUrl.pathname.startsWith("/redefinir-senha");

  if (!user && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // Preserva pra onde a pessoa tentou ir (ex.: um link direto de
    // aprovação mandado pro cliente) -- o login volta pra cá depois de
    // autenticar, em vez de cair sempre no destino padrão do perfil.
    url.searchParams.set("next", request.nextUrl.pathname);
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
    const nextParam = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    url.search = "";

    if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")) {
      url.pathname = nextParam;
    } else {
      const { data: profile } = await supabase
        .from("profile")
        .select("role")
        .eq("id", user.id)
        .single();
      url.pathname = profile?.role === "cliente" ? "/portal" : "/clientes";
    }

    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ConvidarLoginClient } from "./convidar-login-client";

export default async function ConvidarLoginPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profile")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || !["socio", "gestor"].includes(profile.role)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
        <p className="mt-2 text-sm text-gray-600">
          Só sócio e gestor podem convidar login de cliente.
        </p>
      </main>
    );
  }

  const { data: client } = await supabase
    .from("client")
    .select("id, legal_name")
    .eq("id", id)
    .single();

  if (!client) notFound();

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-10">
        <Link
          href={`/clientes/${id}`}
          className="text-sm text-gray-500 hover:underline"
        >
          ← Voltar
        </Link>
        <h1 className="mb-2 mt-2 text-xl font-semibold">Convidar login</h1>
        <p className="mb-8 text-sm text-gray-500">
          Pra {client.legal_name} acompanhar e aprovar demandas direto pelo
          sistema.
        </p>
        <ConvidarLoginClient clientId={id} />
      </div>
    </AppShell>
  );
}

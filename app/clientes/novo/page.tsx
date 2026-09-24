import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { NovoClienteClient } from "./novo-client";

export default async function NovoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string }>;
}) {
  const { leadId } = await searchParams;
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

  if (!profile || !["socio", "financeiro", "gestor"].includes(profile.role)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
      </main>
    );
  }

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-10">
        <Link href="/clientes" className="text-sm text-gray-500 hover:underline">
          ← Voltar
        </Link>
        <h1 className="mb-8 mt-2 text-xl font-semibold">Cadastrar cliente direto</h1>
        {leadId && (
          <p className="mb-4 text-sm text-gray-500">
            Este cliente será vinculado ao lead automaticamente ao salvar.
          </p>
        )}
        <NovoClienteClient leadId={leadId} />
      </div>
    </AppShell>
  );
}

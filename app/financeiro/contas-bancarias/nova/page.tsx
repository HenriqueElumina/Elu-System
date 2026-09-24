import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { NovaContaBancariaClient } from "./nova-conta-bancaria-client";

export default async function NovaContaBancariaPage() {
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

  if (!profile || !["socio", "financeiro"].includes(profile.role)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
        <p className="mt-2 text-sm text-gray-600">
          Só sócio e financeiro podem cadastrar contas bancárias.
        </p>
      </main>
    );
  }

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-10">
        <Link
          href="/financeiro/contas-bancarias"
          className="text-sm text-gray-500 hover:underline"
        >
          ← Voltar
        </Link>
        <h1 className="mb-8 mt-2 text-xl font-semibold">Nova conta bancária</h1>
        <NovaContaBancariaClient />
      </div>
    </AppShell>
  );
}

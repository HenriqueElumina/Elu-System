import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NovoLeadClient } from "./novo-lead-client";

export default async function NovoLeadPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profile")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["socio", "gestor"].includes(profile.role)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/leads" className="text-sm text-gray-500 hover:underline">
        ← Voltar
      </Link>
      <h1 className="mb-8 mt-2 text-xl font-semibold">Novo lead</h1>
      <NovoLeadClient />
    </main>
  );
}

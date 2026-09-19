import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NovaPropostaClient } from "./nova-proposta-client";

export default async function NovaPropostaPage({
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

  const { data: services } = await supabase
    .from("service")
    .select("id, name, base_price_cents")
    .eq("active", true)
    .is("deleted_at", null)
    .order("name");

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href={`/leads/${id}`} className="text-sm text-gray-500 hover:underline">
        ← Voltar
      </Link>
      <h1 className="mb-8 mt-2 text-xl font-semibold">Nova proposta</h1>
      {services && services.length === 0 ? (
        <p className="text-sm text-amber-800">
          Nenhum serviço ativo no catálogo ainda. Cadastre um serviço antes de
          montar a proposta.
        </p>
      ) : (
        <NovaPropostaClient leadId={id} services={services ?? []} />
      )}
    </main>
  );
}

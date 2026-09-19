import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isInternalRole } from "@/lib/auth/roles";
import { LogoutButton } from "./logout-button";

export default async function ClientesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || !isInternalRole(profile.role)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sua conta ainda não tem um perfil interno liberado. Fale com um
          sócio.
        </p>
      </main>
    );
  }

  const { data: clients, error } = await supabase
    .from("client")
    .select("id, legal_name, trade_name, document, active")
    .is("deleted_at", null)
    .order("legal_name");

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Clientes</h1>
          <p className="text-sm text-gray-500">
            Logado como {profile.full_name} ({profile.role})
          </p>
        </div>
        <LogoutButton />
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Erro ao carregar clientes: {error.message}
        </p>
      )}

      {!error && clients?.length === 0 && (
        <p className="text-sm text-gray-500">Nenhum cliente cadastrado ainda.</p>
      )}

      {!error && clients && clients.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-4">Razão social</th>
              <th className="py-2 pr-4">Nome fantasia</th>
              <th className="py-2 pr-4">Documento</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-gray-100">
                <td className="py-2 pr-4">{client.legal_name}</td>
                <td className="py-2 pr-4">{client.trade_name ?? "-"}</td>
                <td className="py-2 pr-4">{client.document}</td>
                <td className="py-2">{client.active ? "Ativo" : "Inativo"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

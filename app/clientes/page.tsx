import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isInternalRole } from "@/lib/auth/roles";
import { AppShell } from "@/components/app-shell";
import { InviteButton } from "./invite-button";

const ONBOARDING_STATUS_LABEL: Record<string, string> = {
  invited: "Convite enviado",
  pending_review: "Aguardando revisão",
  approved: "Ativo",
};

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

  const canManageInvites = profile.role === "socio" || profile.role === "gestor";

  const { data: clients, error } = await supabase
    .from("client")
    .select("id, legal_name, trade_name, document, onboarding_status")
    .is("deleted_at", null)
    .order("legal_name");

  const { data: pendingInvites } = canManageInvites
    ? await supabase
        .from("client_invite")
        .select("id, token, note, created_at, expires_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : { data: null };

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Clientes</h1>
      </div>

      {canManageInvites && (
        <div className="mb-8 flex flex-wrap items-start gap-3">
          <InviteButton />
          <Link
            href="/clientes/novo"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            + Cadastrar cliente direto
          </Link>
        </div>
      )}

      {canManageInvites && pendingInvites && pendingInvites.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">
            Convites aguardando resposta
          </h2>
          <ul className="space-y-1 text-sm text-gray-600">
            {pendingInvites.map((invite) => (
              <li key={invite.id}>
                {invite.note || "Sem nota"} — expira em{" "}
                {new Date(invite.expires_at).toLocaleDateString("pt-BR")}
              </li>
            ))}
          </ul>
        </div>
      )}

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
                <td className="py-2 pr-4">
                  <Link
                    href={`/clientes/${client.id}`}
                    className="text-gray-900 underline-offset-2 hover:underline"
                  >
                    {client.legal_name}
                  </Link>
                </td>
                <td className="py-2 pr-4">{client.trade_name ?? "-"}</td>
                <td className="py-2 pr-4">{client.document}</td>
                <td className="py-2">
                  {ONBOARDING_STATUS_LABEL[client.onboarding_status] ??
                    client.onboarding_status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </AppShell>
  );
}

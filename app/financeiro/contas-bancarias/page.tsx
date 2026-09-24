import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function ContasBancariasPage() {
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

  const canManageFinance =
    profile.role === "socio" || profile.role === "financeiro";

  const { data: bankAccounts, error } = await supabase
    .from("bank_account")
    .select("id, name, bank_name, agency, account_number, active")
    .order("name");

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Contas bancárias</h1>
        {canManageFinance && (
          <Link
            href="/financeiro/contas-bancarias/nova"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Nova conta
          </Link>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Erro ao carregar contas bancárias: {error.message}
        </p>
      )}

      {!error && bankAccounts?.length === 0 && (
        <p className="text-sm text-gray-500">
          Nenhuma conta bancária cadastrada ainda.
        </p>
      )}

      {!error && bankAccounts && bankAccounts.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-4">Nome</th>
              <th className="py-2 pr-4">Banco</th>
              <th className="py-2 pr-4">Agência</th>
              <th className="py-2 pr-4">Conta</th>
              <th className="py-2">Ativa</th>
            </tr>
          </thead>
          <tbody>
            {bankAccounts.map((account) => (
              <tr key={account.id} className="border-b border-gray-100">
                <td className="py-2 pr-4">{account.name}</td>
                <td className="py-2 pr-4">{account.bank_name}</td>
                <td className="py-2 pr-4">{account.agency}</td>
                <td className="py-2 pr-4">{account.account_number}</td>
                <td className="py-2">{account.active ? "Sim" : "Não"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </AppShell>
  );
}

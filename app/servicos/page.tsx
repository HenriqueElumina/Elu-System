import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isInternalRole } from "@/lib/auth/roles";
import { AppShell } from "@/components/app-shell";
import {
  BILLING_TYPE_LABELS,
  SERVICE_LINE_LABELS,
  centsToReais,
} from "@/lib/validation/service";

export default async function ServicosPage() {
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

  if (!profile || !isInternalRole(profile.role)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
      </main>
    );
  }

  const { data: services, error } = await supabase
    .from("service")
    .select("id, name, service_line, billing_type, base_price_cents, active")
    .is("deleted_at", null)
    .order("name");

  return (
    <AppShell userName={profile.full_name} userRole={profile.role}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Catálogo de serviços</h1>
        {profile.role === "socio" && (
          <Link
            href="/servicos/novo"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Novo serviço
          </Link>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Erro ao carregar serviços: {error.message}
        </p>
      )}

      {!error && services?.length === 0 && (
        <p className="text-sm text-gray-500">Nenhum serviço cadastrado ainda.</p>
      )}

      {!error && services && services.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-4">Nome</th>
              <th className="py-2 pr-4">Linha de negócio</th>
              <th className="py-2 pr-4">Cobrança</th>
              <th className="py-2 pr-4">Preço</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-b border-gray-100">
                <td className="py-2 pr-4">
                  <Link
                    href={`/servicos/${service.id}`}
                    className="text-gray-900 underline-offset-2 hover:underline"
                  >
                    {service.name}
                  </Link>
                </td>
                <td className="py-2 pr-4">
                  {SERVICE_LINE_LABELS[
                    service.service_line as keyof typeof SERVICE_LINE_LABELS
                  ] ?? service.service_line}
                </td>
                <td className="py-2 pr-4">
                  {BILLING_TYPE_LABELS[
                    service.billing_type as keyof typeof BILLING_TYPE_LABELS
                  ] ?? service.billing_type}
                </td>
                <td className="py-2 pr-4">
                  {centsToReais(service.base_price_cents).toLocaleString(
                    "pt-BR",
                    { style: "currency", currency: "BRL" },
                  )}
                </td>
                <td className="py-2">{service.active ? "Ativo" : "Inativo"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </AppShell>
  );
}

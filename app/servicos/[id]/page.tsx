import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isInternalRole } from "@/lib/auth/roles";
import {
  BILLING_TYPE_LABELS,
  SERVICE_LINE_LABELS,
  centsToReais,
} from "@/lib/validation/service";
import { EditarServicoClient } from "./editar-servico-client";
import { PlaybookStepsEditor } from "./playbook-steps-editor";

export default async function ServicoDetailPage({
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

  if (!profile || !isInternalRole(profile.role)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
      </main>
    );
  }

  const { data: service } = await supabase
    .from("service")
    .select("*")
    .eq("id", id)
    .single();

  if (!service) notFound();

  const { data: steps } = await supabase
    .from("playbook_step")
    .select("id, position, name, description, sla_days")
    .eq("service_id", id)
    .order("position", { ascending: true });

  const canEdit = profile.role === "socio";

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/servicos" className="text-sm text-gray-500 hover:underline">
        ← Voltar
      </Link>
      <h1 className="mb-8 mt-2 text-xl font-semibold">{service.name}</h1>

      <section className="mb-10">
        {canEdit ? (
          <EditarServicoClient
            serviceId={service.id}
            defaultValues={{
              name: service.name,
              description: service.description ?? "",
              serviceLine: service.service_line,
              billingType: service.billing_type,
              basePriceReais: centsToReais(service.base_price_cents),
              active: service.active,
            }}
          />
        ) : (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Descrição</dt>
              <dd>{service.description || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Linha de negócio</dt>
              <dd>
                {SERVICE_LINE_LABELS[
                  service.service_line as keyof typeof SERVICE_LINE_LABELS
                ] ?? service.service_line}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Cobrança</dt>
              <dd>
                {BILLING_TYPE_LABELS[
                  service.billing_type as keyof typeof BILLING_TYPE_LABELS
                ] ?? service.billing_type}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Preço</dt>
              <dd>
                {centsToReais(service.base_price_cents).toLocaleString(
                  "pt-BR",
                  { style: "currency", currency: "BRL" },
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd>{service.active ? "Ativo" : "Inativo"}</dd>
            </div>
          </dl>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Playbook (etapas)
        </h2>
        <PlaybookStepsEditor
          serviceId={service.id}
          steps={steps ?? []}
          canEdit={canEdit}
        />
      </section>
    </main>
  );
}

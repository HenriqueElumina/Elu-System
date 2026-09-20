import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { centsToReais } from "@/lib/validation/service";
import { ContratoStatusChanger } from "./contrato-status-changer";
import { EnviarAssinatura } from "./enviar-assinatura";
import { BaixarPdfAssinado } from "./baixar-pdf-assinado";
import { MarcarFaturaPaga } from "./marcar-fatura-paga";
import { BoletoActions } from "./boleto-actions";
import { INVOICE_STATUS_LABELS } from "@/lib/billing/receivable";

export default async function ContratoDetailPage({
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

  if (!profile || !["socio", "financeiro", "gestor"].includes(profile.role)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
      </main>
    );
  }

  const { data: contract } = await supabase
    .from("contract")
    .select(
      "id, status, start_date, end_date, signature_provider, signature_status, signed_at, external_signature_id, client:client_id(id, legal_name), contract_item(id, quantity, unit_price_cents, service:service_id(name))",
    )
    .eq("id", id)
    .single();

  if (!contract) notFound();

  const { data: project } = await supabase
    .from("project")
    .select("id, name")
    .eq("contract_id", contract.id)
    .maybeSingle();

  const { data: invoices } = await supabase
    .from("invoice")
    .select("id, due_date, amount_cents, status, external_charge_id")
    .eq("contract_id", contract.id)
    .order("due_date");

  const canManage = profile.role === "socio" || profile.role === "gestor";
  const canManageFinance =
    profile.role === "socio" || profile.role === "financeiro";
  const client = contract.client as unknown as {
    id: string;
    legal_name: string;
  } | null;
  const items = contract.contract_item ?? [];
  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price_cents,
    0,
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/contratos" className="text-sm text-gray-500 hover:underline">
        ← Voltar
      </Link>
      <h1 className="mb-6 mt-2 text-xl font-semibold">
        Contrato —{" "}
        {client ? (
          <Link href={`/clientes/${client.id}`} className="hover:underline">
            {client.legal_name}
          </Link>
        ) : (
          "-"
        )}
      </h1>

      {canManage && (
        <div className="mb-4">
          <ContratoStatusChanger
            contractId={contract.id}
            currentStatus={contract.status}
          />
        </div>
      )}

      {project && (
        <p className="mb-4 text-sm text-gray-600">
          Projeto criado:{" "}
          <Link
            href={`/clientes/${client?.id}`}
            className="font-medium underline-offset-2 hover:underline"
          >
            {project.name}
          </Link>
        </p>
      )}

      {canManage && (
        <div className="mb-8 space-y-3">
          {contract.external_signature_id && (
            <p className="text-sm text-gray-600">
              Enviado para assinatura (ZapSign) — status:{" "}
              <span className="font-medium">
                {contract.signature_status ?? "pending"}
              </span>
              {contract.signed_at &&
                ` — assinado em ${new Date(contract.signed_at).toLocaleDateString("pt-BR")}`}
            </p>
          )}
          {contract.signature_status === "signed" ? (
            <BaixarPdfAssinado contractId={contract.id} />
          ) : (
            <EnviarAssinatura
              contractId={contract.id}
              isResend={Boolean(contract.external_signature_id)}
            />
          )}
        </div>
      )}

      <dl className="mb-8 space-y-2 text-sm">
        <div>
          <dt className="text-gray-500">Início</dt>
          <dd>{new Date(contract.start_date).toLocaleDateString("pt-BR")}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Fim</dt>
          <dd>
            {contract.end_date
              ? new Date(contract.end_date).toLocaleDateString("pt-BR")
              : "-"}
          </dd>
        </div>
      </dl>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Itens</h2>
        <ul className="space-y-1 text-sm">
          {items.map((item) => {
            const service = item.service as unknown as { name: string } | null;
            return (
              <li key={item.id}>
                {service?.name ?? "Serviço"} — {item.quantity}x{" "}
                {centsToReais(item.unit_price_cents).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-sm font-medium">
          Total:{" "}
          {centsToReais(total).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </p>
      </section>

      {invoices && invoices.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Faturas</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-4">Vencimento</th>
                <th className="py-2 pr-4">Valor</th>
                <th className="py-2 pr-4">Status</th>
                {canManageFinance && <th className="py-2"></th>}
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">
                    {new Date(invoice.due_date).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-2 pr-4">
                    {centsToReais(invoice.amount_cents).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="py-2 pr-4">
                    {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                  </td>
                  {canManageFinance && (
                    <td className="space-y-1 py-2">
                      {invoice.status === "pending" && (
                        <>
                          <BoletoActions
                            invoiceId={invoice.id}
                            contractId={contract.id}
                            hasCharge={Boolean(invoice.external_charge_id)}
                          />
                          <MarcarFaturaPaga
                            invoiceId={invoice.id}
                            contractId={contract.id}
                          />
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

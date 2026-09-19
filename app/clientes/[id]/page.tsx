import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isInternalRole } from "@/lib/auth/roles";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/validation/client-intake";
import { ApproveButton } from "./approve-button";

const ONBOARDING_STATUS_LABEL: Record<string, string> = {
  invited: "Convite enviado",
  pending_review: "Aguardando revisão",
  approved: "Ativo",
};

export default async function ClienteDetailPage({
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

  const { data: client } = await supabase
    .from("client")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const { data: contacts } = await supabase
    .from("client_contact")
    .select("full_name, email, phone, role_title, is_primary, is_billing")
    .eq("client_id", id)
    .is("deleted_at", null);

  const { data: socialAccounts } = await supabase
    .from("client_social_account")
    .select("platform, platform_other_label, handle, followers_count")
    .eq("client_id", id);

  const canApprove =
    client.onboarding_status === "pending_review" &&
    (profile.role === "socio" || profile.role === "gestor" || profile.role === "financeiro");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/clientes" className="text-sm text-gray-500 hover:underline">
        ← Voltar
      </Link>

      <div className="mt-2 mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{client.legal_name}</h1>
          <p className="text-sm text-gray-500">
            {client.trade_name && `${client.trade_name} — `}
            {ONBOARDING_STATUS_LABEL[client.onboarding_status] ??
              client.onboarding_status}
          </p>
        </div>
        {canApprove && <ApproveButton clientId={client.id} />}
      </div>

      <Section title="Dados da empresa">
        <Field label="Documento">
          {client.document_type?.toUpperCase()}: {client.document}
        </Field>
        <Field label="E-mail">{client.email || "-"}</Field>
        <Field label="Telefone">{client.phone || "-"}</Field>
        <Field label="Endereço">
          {client.address_street
            ? `${client.address_street}, ${client.address_number}${
                client.address_complement ? ` - ${client.address_complement}` : ""
              } — ${client.address_neighborhood}, ${client.address_city}/${client.address_state} — ${client.address_zip_code}`
            : "-"}
        </Field>
      </Section>

      <Section title="Contatos">
        {contacts && contacts.length > 0 ? (
          <ul className="space-y-2">
            {contacts.map((contact, index) => (
              <li key={index} className="text-sm">
                <span className="font-medium">{contact.full_name}</span>
                {contact.role_title && ` — ${contact.role_title}`}
                <br />
                {contact.email} · {contact.phone}
                <br />
                <span className="text-gray-500">
                  {[
                    contact.is_primary && "Contato principal",
                    contact.is_billing && "Contato financeiro",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Nenhum contato cadastrado.</p>
        )}
      </Section>

      <Section title="Redes sociais">
        {socialAccounts && socialAccounts.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {socialAccounts.map((account, index) => (
              <li key={index}>
                {account.platform === "other"
                  ? account.platform_other_label
                  : SOCIAL_PLATFORM_LABELS[
                      account.platform as keyof typeof SOCIAL_PLATFORM_LABELS
                    ]}
                : {account.handle || "-"}
                {account.followers_count != null &&
                  ` — ${account.followers_count.toLocaleString("pt-BR")} seguidores/inscritos`}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Nenhuma rede social informada.</p>
        )}
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 text-sm">
      <span className="text-gray-500">{label}: </span>
      <span>{children}</span>
    </div>
  );
}

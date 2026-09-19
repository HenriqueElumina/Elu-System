"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClientIntakeForm } from "@/components/client-intake-form";
import {
  buildSocialAccountsPayload,
  type ClientIntakeInput,
} from "@/lib/validation/client-intake";

type InviteState =
  | { status: "loading" }
  | { status: "invalid"; reason: string }
  | { status: "ready" };

const INVALID_REASON_MESSAGES: Record<string, string> = {
  not_found: "Este link não é válido. Confira com quem te enviou.",
  already_submitted: "Este link já foi usado — os dados já foram enviados.",
  expired: "Este link expirou. Peça um novo link pra agência.",
};

export function ConviteClient({ token }: { token: string }) {
  const [state, setState] = useState<InviteState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const supabase = createClient();
      const { data, error } = await supabase
        .rpc("get_client_invite", { p_token: token })
        .single<{ valid: boolean; reason: string | null }>();

      if (cancelled) return;

      if (error || !data) {
        setState({ status: "invalid", reason: "not_found" });
        return;
      }

      if (!data.valid) {
        setState({ status: "invalid", reason: data.reason ?? "not_found" });
        return;
      }

      setState({ status: "ready" });
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.status === "loading") {
    return <p className="text-sm text-gray-500">Carregando...</p>;
  }

  if (state.status === "invalid") {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        {INVALID_REASON_MESSAGES[state.reason] ??
          "Não foi possível abrir este link."}
      </div>
    );
  }

  async function handleSubmit(data: ClientIntakeInput) {
    const supabase = createClient();
    const social = buildSocialAccountsPayload(data);

    const { error } = await supabase.rpc("submit_client_invite", {
      p_token: token,
      p_legal_name: data.legalName,
      p_trade_name: data.tradeName || null,
      p_document_type: data.documentType,
      p_document: data.document,
      p_email: data.email || null,
      p_phone: data.phone,
      p_address_zip_code: data.addressZipCode,
      p_address_street: data.addressStreet,
      p_address_number: data.addressNumber,
      p_address_complement: data.addressComplement || null,
      p_address_neighborhood: data.addressNeighborhood,
      p_address_city: data.addressCity,
      p_address_state: data.addressState,
      p_contact_name: data.primaryContact.name,
      p_contact_role_title: data.primaryContact.roleTitle || null,
      p_contact_email: data.primaryContact.email,
      p_contact_phone: data.primaryContact.phone,
      p_billing_same_as_primary: data.billingSameAsPrimary,
      p_billing_contact_name: data.billingContact?.name || null,
      p_billing_contact_email: data.billingContact?.email || null,
      p_billing_contact_phone: data.billingContact?.phone || null,
      p_social: social,
    });

    if (error) {
      if (error.code === "23505") {
        return {
          ok: false as const,
          message: "Esse CNPJ/CPF já está cadastrado. Fale com a agência.",
        };
      }
      return {
        ok: false as const,
        message: error.message || "Não foi possível enviar. Tente de novo.",
      };
    }

    return { ok: true as const };
  }

  return (
    <ClientIntakeForm
      onSubmit={handleSubmit}
      submitLabel="Enviar dados"
      successMessage="Obrigado! Seus dados foram enviados e serão revisados pela nossa equipe em breve."
    />
  );
}

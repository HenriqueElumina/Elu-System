"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  buildSocialAccountsPayload,
  clientIntakeSchema,
  type ClientIntakeInput,
} from "@/lib/validation/client-intake";
import {
  createClientUserInviteSchema,
  type CreateClientUserInviteInput,
} from "@/lib/validation/client-user";

export async function createInvite(note: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data, error } = await supabase
    .from("client_invite")
    .insert({ note: note || null, created_by_profile_id: user.id })
    .select("token")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/clientes");
  return { token: data.token as string };
}

export async function approveClient(clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("client")
    .update({ onboarding_status: "approved", active: true })
    .eq("id", clientId);

  if (error) throw new Error(error.message);

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
}

type ActionResult =
  | { ok: true; clientId: string }
  | { ok: false; message: string };

export async function createClientDirect(
  input: ClientIntakeInput,
  leadId?: string,
): Promise<ActionResult> {
  const parsed = clientIntakeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Dados inválidos, confira o formulário." };
  }
  const data = parsed.data;
  const supabase = await createClient();

  const { data: client, error: clientError } = await supabase
    .from("client")
    .insert({
      legal_name: data.legalName,
      trade_name: data.tradeName || null,
      document_type: data.documentType,
      document: data.document,
      email: data.email || null,
      phone: data.phone,
      address_zip_code: data.addressZipCode,
      address_street: data.addressStreet,
      address_number: data.addressNumber,
      address_complement: data.addressComplement || null,
      address_neighborhood: data.addressNeighborhood,
      address_city: data.addressCity,
      address_state: data.addressState.toUpperCase(),
      onboarding_status: "approved",
    })
    .select("id")
    .single();

  if (clientError || !client) {
    if (clientError?.code === "23505") {
      return { ok: false, message: "Esse CNPJ/CPF já está cadastrado." };
    }
    return {
      ok: false,
      message: clientError?.message ?? "Erro ao criar cliente.",
    };
  }

  const contactRows = [
    {
      client_id: client.id,
      full_name: data.primaryContact.name,
      email: data.primaryContact.email,
      phone: data.primaryContact.phone,
      role_title: data.primaryContact.roleTitle || null,
      is_primary: true,
      is_billing: data.billingSameAsPrimary,
    },
    ...(data.billingSameAsPrimary
      ? []
      : [
          {
            client_id: client.id,
            full_name: data.billingContact?.name ?? "",
            email: data.billingContact?.email ?? "",
            phone: data.billingContact?.phone ?? "",
            role_title: null,
            is_primary: false,
            is_billing: true,
          },
        ]),
  ];

  const { error: contactError } = await supabase
    .from("client_contact")
    .insert(contactRows);
  if (contactError) {
    return { ok: false, message: contactError.message };
  }

  const social = buildSocialAccountsPayload(data);
  if (social.length > 0) {
    const { error: socialError } = await supabase
      .from("client_social_account")
      .insert(
        social.map((entry) => ({
          client_id: client.id,
          platform: entry.platform,
          platform_other_label: entry.platformOtherLabel ?? null,
          handle: entry.handle ?? null,
          followers_count: entry.followersCount ?? null,
        })),
      );
    if (socialError) {
      return { ok: false, message: socialError.message };
    }
  }

  if (leadId) {
    const { error: leadError } = await supabase
      .from("lead")
      .update({ client_id: client.id })
      .eq("id", leadId);
    if (leadError) {
      return { ok: false, message: leadError.message };
    }
    revalidatePath(`/leads/${leadId}`);
  }

  revalidatePath("/clientes");
  return { ok: true, clientId: client.id as string };
}

export async function createClientUserInvite(
  clientId: string,
  input: CreateClientUserInviteInput,
): Promise<{ ok: true; token: string } | { ok: false; message: string }> {
  const parsed = createClientUserInviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sessão expirada." };

  const { data: invite, error } = await supabase
    .from("client_user_invite")
    .insert({
      email: data.email,
      client_id: clientId,
      created_by_profile_id: user.id,
    })
    .select("token")
    .single();

  if (error || !invite) {
    return { ok: false, message: error?.message ?? "Erro ao gerar o convite." };
  }

  revalidatePath(`/clientes/${clientId}`);
  return { ok: true, token: invite.token as string };
}

export async function linkLeadToClient(
  leadId: string,
  clientId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lead")
    .update({ client_id: clientId })
    .eq("id", leadId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  addOneMonth,
  createContractSchema,
  type CreateContractInput,
  type CONTRACT_STATUSES,
} from "@/lib/validation/contract";
import { CONTRACT_SIGNER } from "@/lib/config";
import { createDocument } from "@/lib/zapsign/client";
import { renderContractPdfBase64 } from "@/lib/pdf/render-contract-pdf";
import type { ContractPdfItem } from "@/lib/pdf/contract-document";

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : T))
  | { ok: false; message: string };

export async function createContractFromProposal(
  proposalId: string,
  input: CreateContractInput,
): Promise<ActionResult<{ contractId: string }>> {
  const parsed = createContractSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();

  const { data: proposal, error: proposalError } = await supabase
    .from("proposal")
    .select("id, status, lead_id, lead:lead_id(client_id)")
    .eq("id", proposalId)
    .single();

  if (proposalError || !proposal) {
    return { ok: false, message: "Proposta não encontrada." };
  }
  if (proposal.status !== "accepted") {
    return { ok: false, message: "Só dá pra gerar contrato de proposta aceita." };
  }
  const clientId = (proposal.lead as unknown as { client_id: string | null })
    ?.client_id;
  if (!clientId) {
    return {
      ok: false,
      message: "Vincule um cliente ao lead antes de gerar o contrato.",
    };
  }

  const { data: items } = await supabase
    .from("proposal_item")
    .select("service_id, quantity, unit_price_cents, service:service_id(billing_type)")
    .eq("proposal_id", proposalId);

  if (!items || items.length === 0) {
    return { ok: false, message: "Proposta sem itens." };
  }

  const { data: contract, error: contractError } = await supabase
    .from("contract")
    .insert({
      client_id: clientId,
      proposal_id: proposalId,
      start_date: data.startDate,
      end_date: data.endDate || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (contractError || !contract) {
    if (contractError?.code === "23505") {
      return { ok: false, message: "Essa proposta já tem um contrato gerado." };
    }
    return {
      ok: false,
      message: contractError?.message ?? "Erro ao criar contrato.",
    };
  }

  const { error: itemsError } = await supabase.from("contract_item").insert(
    items.map((item) => ({
      contract_id: contract.id,
      service_id: item.service_id,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      billing_type: (item.service as unknown as { billing_type: string })
        .billing_type,
    })),
  );

  if (itemsError) {
    return { ok: false, message: itemsError.message };
  }

  revalidatePath(`/leads/${proposal.lead_id}/propostas/${proposalId}`);
  revalidatePath("/contratos");
  return { ok: true, contractId: contract.id as string };
}

export async function sendContractForSignature(
  contractId: string,
  includedExtras: string[],
): Promise<ActionResult<{ signUrls: { name: string; url: string }[] }>> {
  const supabase = await createClient();

  const { data: contract, error: contractError } = await supabase
    .from("contract")
    .select(
      "id, start_date, status, external_signature_id, signature_status, client:client_id(legal_name, trade_name, document_type, document, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip_code, phone, id), contract_item(quantity, unit_price_cents, billing_type, service:service_id(name, description))",
    )
    .eq("id", contractId)
    .single();

  if (contractError || !contract) {
    return { ok: false, message: "Contrato não encontrado." };
  }
  if (contract.signature_status === "signed") {
    return { ok: false, message: "Este contrato já foi assinado." };
  }

  const client = contract.client as unknown as {
    id: string;
    legal_name: string;
    trade_name: string | null;
    document_type: "cnpj" | "cpf";
    document: string;
    address_street: string | null;
    address_number: string | null;
    address_complement: string | null;
    address_neighborhood: string | null;
    address_city: string | null;
    address_state: string | null;
    address_zip_code: string | null;
    phone: string | null;
  } | null;

  if (!client) {
    return { ok: false, message: "Contrato sem cliente vinculado." };
  }

  const { data: primaryContact } = await supabase
    .from("client_contact")
    .select("full_name, email")
    .eq("client_id", client.id)
    .eq("is_primary", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (!primaryContact?.email) {
    return {
      ok: false,
      message: "Cliente sem contato principal com e-mail cadastrado.",
    };
  }

  const items = (contract.contract_item ?? []) as unknown as Array<{
    quantity: number;
    unit_price_cents: number;
    billing_type: string;
    service: { name: string; description: string | null };
  }>;

  const monthlyTotalCents = items
    .filter((item) => item.billing_type === "recurring_monthly")
    .reduce((sum, item) => sum + item.quantity * item.unit_price_cents, 0);

  const pdfItems: ContractPdfItem[] = items.map((item) => ({
    serviceName: item.service.name,
    serviceDescription: item.service.description,
  }));

  const base64Pdf = await renderContractPdfBase64({
    client: {
      legalName: client.legal_name,
      tradeName: client.trade_name,
      documentType: client.document_type,
      document: client.document,
      addressStreet: client.address_street,
      addressNumber: client.address_number,
      addressComplement: client.address_complement,
      addressNeighborhood: client.address_neighborhood,
      addressCity: client.address_city,
      addressState: client.address_state,
      addressZipCode: client.address_zip_code,
      phone: client.phone,
    },
    clientSignerName: primaryContact.full_name,
    startDate: contract.start_date,
    endDate: null,
    items: pdfItems,
    includedExtraKeys: includedExtras,
    monthlyTotalCents,
    firstPaymentDate: addOneMonth(contract.start_date),
  });

  let zapDoc;
  try {
    zapDoc = await createDocument({
      name: `Contrato - ${client.legal_name}`,
      base64Pdf,
      signers: [
        { name: CONTRACT_SIGNER.name, email: CONTRACT_SIGNER.email },
        { name: primaryContact.full_name, email: primaryContact.email },
      ],
    });
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Erro ao enviar pro ZapSign.",
    };
  }

  const { error: updateError } = await supabase
    .from("contract")
    .update({
      signature_provider: "zapsign",
      external_signature_id: zapDoc.token,
      signature_status: zapDoc.status,
      included_extras: includedExtras,
      status: "sent",
    })
    .eq("id", contractId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  revalidatePath(`/contratos/${contractId}`);
  return {
    ok: true,
    signUrls: zapDoc.signers.map((signer) => ({
      name: signer.name,
      url: signer.sign_url,
    })),
  };
}

export async function updateContractStatus(
  contractId: string,
  status: (typeof CONTRACT_STATUSES)[number],
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contract")
    .update({ status })
    .eq("id", contractId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/contratos");
  revalidatePath(`/contratos/${contractId}`);
  return { ok: true };
}

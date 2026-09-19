"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createContractSchema,
  type CreateContractInput,
  type CONTRACT_STATUSES,
} from "@/lib/validation/contract";

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

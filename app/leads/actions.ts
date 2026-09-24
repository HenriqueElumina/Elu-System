"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { leadSchema, LEAD_STATUSES, type LeadInput } from "@/lib/validation/lead";
import { proposalSchema, type ProposalInput } from "@/lib/validation/proposal";
import { reaisToCents } from "@/lib/validation/service";

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : T))
  | { ok: false; message: string };

export async function createLead(
  input: LeadInput,
): Promise<ActionResult<{ leadId: string }>> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Não autenticado." };

  const { data: lead, error } = await supabase
    .from("lead")
    .insert({
      company_name: data.companyName,
      contact_name: data.contactName || null,
      contact_email: data.contactEmail || null,
      contact_phone: data.contactPhone || null,
      owner_profile_id: user.id,
    })
    .select("id")
    .single();

  if (error || !lead) {
    return { ok: false, message: error?.message ?? "Erro ao criar lead." };
  }

  revalidatePath("/leads");
  return { ok: true, leadId: lead.id as string };
}

export async function updateLead(
  leadId: string,
  input: LeadInput,
): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("lead")
    .update({
      company_name: data.companyName,
      contact_name: data.contactName || null,
      contact_email: data.contactEmail || null,
      contact_phone: data.contactPhone || null,
    })
    .eq("id", leadId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function changeLeadStatus(
  leadId: string,
  status: (typeof LEAD_STATUSES)[number],
  lostReason?: string,
): Promise<ActionResult> {
  if (!LEAD_STATUSES.includes(status)) {
    return { ok: false, message: "Estágio inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("lead")
    .update({
      status,
      lost_reason: status === "lost" ? lostReason || null : null,
    })
    .eq("id", leadId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function createProposal(
  leadId: string,
  input: ProposalInput,
): Promise<ActionResult<{ proposalId: string }>> {
  const parsed = proposalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();

  const { data: proposal, error } = await supabase
    .from("proposal")
    .insert({ lead_id: leadId, notes: data.notes || null })
    .select("id")
    .single();

  if (error || !proposal) {
    return { ok: false, message: error?.message ?? "Erro ao criar proposta." };
  }

  const { error: itemsError } = await supabase.from("proposal_item").insert(
    data.items.map((item) => ({
      proposal_id: proposal.id,
      service_id: item.serviceId,
      quantity: item.quantity,
      unit_price_cents: reaisToCents(item.unitPriceReais),
    })),
  );

  if (itemsError) {
    return { ok: false, message: itemsError.message };
  }

  revalidatePath(`/leads/${leadId}`);
  return { ok: true, proposalId: proposal.id as string };
}

export async function updateProposal(
  proposalId: string,
  leadId: string,
  input: ProposalInput,
): Promise<ActionResult> {
  const parsed = proposalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("proposal")
    .update({ notes: data.notes || null })
    .eq("id", proposalId);
  if (updateError) return { ok: false, message: updateError.message };

  const { error: deleteError } = await supabase
    .from("proposal_item")
    .delete()
    .eq("proposal_id", proposalId);
  if (deleteError) return { ok: false, message: deleteError.message };

  const { error: insertError } = await supabase.from("proposal_item").insert(
    data.items.map((item) => ({
      proposal_id: proposalId,
      service_id: item.serviceId,
      quantity: item.quantity,
      unit_price_cents: reaisToCents(item.unitPriceReais),
    })),
  );
  if (insertError) return { ok: false, message: insertError.message };

  revalidatePath(`/leads/${leadId}`);
  revalidatePath(`/leads/${leadId}/propostas/${proposalId}`);
  return { ok: true };
}

export async function archiveLead(leadId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lead")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/leads");
  return { ok: true };
}

export async function unarchiveLead(leadId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lead")
    .update({ archived_at: null })
    .eq("id", leadId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/leads");
  return { ok: true };
}

export async function deleteLead(leadId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lead")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/leads");
  return { ok: true };
}

export async function changeProposalStatus(
  proposalId: string,
  leadId: string,
  status: "draft" | "sent" | "accepted" | "rejected",
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("proposal")
    .update({ status })
    .eq("id", proposalId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/leads/${leadId}`);
  revalidatePath(`/leads/${leadId}/propostas/${proposalId}`);
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { payableSchema, type PayableInput } from "@/lib/validation/payable";
import { reaisToCents } from "@/lib/validation/service";

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : T))
  | { ok: false; message: string };

export async function createPayable(
  input: PayableInput,
): Promise<ActionResult<{ payableId: string }>> {
  const parsed = payableSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const { data: payable, error } = await supabase
    .from("payable")
    .insert({
      description: data.description,
      amount_cents: reaisToCents(data.amountReais),
      due_date: data.dueDate,
    })
    .select("id")
    .single();

  if (error || !payable) {
    return { ok: false, message: error?.message ?? "Erro ao lançar conta a pagar." };
  }

  revalidatePath("/financeiro/contas-a-pagar");
  return { ok: true, payableId: payable.id as string };
}

export async function markPayableAsPaid(
  payableId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("payable")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", payableId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/financeiro/contas-a-pagar");
  revalidatePath("/financeiro/fluxo-de-caixa");
  return { ok: true };
}

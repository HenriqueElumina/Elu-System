"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { payableSchema, type PayableInput } from "@/lib/validation/payable";
import {
  bankAccountSchema,
  type BankAccountInput,
} from "@/lib/validation/bank-account";
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
  bankAccountId: string,
): Promise<ActionResult> {
  if (!bankAccountId) {
    return { ok: false, message: "Selecione a conta bancária." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_payable_paid", {
    p_payable_id: payableId,
    p_bank_account_id: bankAccountId,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/financeiro/contas-a-pagar");
  revalidatePath("/financeiro/fluxo-de-caixa");
  return { ok: true };
}

export async function revertPayablePayment(
  payableId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revert_payable_payment", {
    p_payable_id: payableId,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/financeiro/contas-a-pagar");
  revalidatePath("/financeiro/fluxo-de-caixa");
  return { ok: true };
}

export async function createBankAccount(
  input: BankAccountInput,
): Promise<ActionResult<{ bankAccountId: string }>> {
  const parsed = bankAccountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const { data: bankAccount, error } = await supabase
    .from("bank_account")
    .insert({
      name: data.name,
      bank_name: data.bankName,
      agency: data.agency,
      account_number: data.accountNumber,
    })
    .select("id")
    .single();

  if (error || !bankAccount) {
    return { ok: false, message: error?.message ?? "Erro ao cadastrar conta bancária." };
  }

  revalidatePath("/financeiro/contas-bancarias");
  return { ok: true, bankAccountId: bankAccount.id as string };
}

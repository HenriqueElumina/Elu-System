"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createEmployeeInviteSchema,
  type CreateEmployeeInviteInput,
} from "@/lib/validation/employee";
import { reaisToCents } from "@/lib/validation/service";

export async function createEmployeeInvite(
  input: CreateEmployeeInviteInput,
): Promise<{ ok: true; token: string } | { ok: false; message: string }> {
  const parsed = createEmployeeInviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sessão expirada." };

  const { data: invite, error } = await supabase
    .from("employee_invite")
    .insert({
      email: data.email,
      role_title: data.roleTitle || null,
      hourly_cost_cents:
        data.hourlyCostReais !== undefined ? reaisToCents(data.hourlyCostReais) : null,
      admission_date: data.admissionDate || null,
      created_by_profile_id: user.id,
    })
    .select("token")
    .single();

  if (error || !invite) {
    return { ok: false, message: error?.message ?? "Erro ao gerar o convite." };
  }

  revalidatePath("/colaboradores");
  return { ok: true, token: invite.token as string };
}

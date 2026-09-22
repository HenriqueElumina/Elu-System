"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createEmployeeInviteSchema,
  updateEmployeeCompensationSchema,
  updateEmployeeRoleTitleSchema,
  type CreateEmployeeInviteInput,
  type UpdateEmployeeCompensationInput,
  type UpdateEmployeeRoleTitleInput,
} from "@/lib/validation/employee";
import { reaisToCents } from "@/lib/validation/service";

type ActionResult = { ok: true } | { ok: false; message: string };

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

export async function updateEmployeeRoleTitle(
  employeeId: string,
  input: UpdateEmployeeRoleTitleInput,
): Promise<ActionResult> {
  const parsed = updateEmployeeRoleTitleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("employee")
    .update({ role_title: data.roleTitle || null })
    .eq("id", employeeId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/colaboradores");
  return { ok: true };
}

export async function updateEmployeeCompensation(
  employeeId: string,
  input: UpdateEmployeeCompensationInput,
): Promise<ActionResult> {
  const parsed = updateEmployeeCompensationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const data = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("employee_compensation").upsert(
    {
      employee_id: employeeId,
      hourly_cost_cents:
        data.hourlyCostReais !== undefined ? reaisToCents(data.hourlyCostReais) : null,
    },
    { onConflict: "employee_id" },
  );

  if (error) return { ok: false, message: error.message };

  revalidatePath("/colaboradores");
  return { ok: true };
}

export async function setEmployeeActive(
  employeeId: string,
  active: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sessão expirada." };

  const { data: employee, error: fetchError } = await supabase
    .from("employee")
    .select("profile_id")
    .eq("id", employeeId)
    .single();

  if (fetchError || !employee) {
    return { ok: false, message: fetchError?.message ?? "Colaborador não encontrado." };
  }

  if (!active && employee.profile_id === user.id) {
    return { ok: false, message: "Você não pode desativar a própria conta." };
  }

  const { error: employeeError } = await supabase
    .from("employee")
    .update({ active })
    .eq("id", employeeId);

  if (employeeError) return { ok: false, message: employeeError.message };

  const { error: profileError } = await supabase
    .from("profile")
    .update({ active })
    .eq("id", employee.profile_id);

  if (profileError) return { ok: false, message: profileError.message };

  revalidatePath("/colaboradores");
  return { ok: true };
}

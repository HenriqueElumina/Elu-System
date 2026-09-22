import { z } from "zod";

export const createEmployeeInviteSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  roleTitle: z.string().trim().max(200).optional(),
  hourlyCostReais: z.coerce.number().nonnegative().optional(),
  admissionDate: z.string().trim().optional(),
});

export type CreateEmployeeInviteInput = z.output<typeof createEmployeeInviteSchema>;

export const completeEmployeeSignupSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome completo"),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
});

export type CompleteEmployeeSignupInput = z.output<typeof completeEmployeeSignupSchema>;

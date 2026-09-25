import { z } from "zod";

export const createClientUserInviteSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

export type CreateClientUserInviteInput = z.output<
  typeof createClientUserInviteSchema
>;

export const completeClientUserSignupSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome completo"),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
});

export type CompleteClientUserSignupInput = z.output<
  typeof completeClientUserSignupSchema
>;

export const requestContentDemandChangesSchema = z.object({
  note: z.string().trim().min(1, "Descreva o que precisa ser ajustado").max(2000),
});

export type RequestContentDemandChangesInput = z.output<
  typeof requestContentDemandChangesSchema
>;

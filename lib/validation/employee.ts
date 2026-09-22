import { z } from "zod";
import { isValidCPF } from "./document";

export const createEmployeeInviteSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  roleTitle: z.string().trim().max(200).optional(),
  hourlyCostReais: z.coerce.number().nonnegative().optional(),
  admissionDate: z.string().trim().optional(),
});

export type CreateEmployeeInviteInput = z.output<typeof createEmployeeInviteSchema>;

// Etapa 9.2 -- ficha de onboarding: cada campo é opcional (só o passo em
// si é obrigatório pra concluir o cadastro, não cada dado individual).
export const employeeOnboardingSchema = z.object({
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
  emergencyContactRelationship: z.string().trim().optional(),
  dietaryRestrictions: z.string().trim().optional(),
  careerGoals: z.string().trim().optional(),
  birthDate: z.string().trim().optional(),
  document: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isValidCPF(value), "CPF inválido"),
  addressZipCode: z.string().trim().optional(),
  addressStreet: z.string().trim().optional(),
  addressNumber: z.string().trim().optional(),
  addressComplement: z.string().trim().optional(),
  addressNeighborhood: z.string().trim().optional(),
  addressCity: z.string().trim().optional(),
  addressState: z.string().trim().max(2).optional(),
});

export type EmployeeOnboardingInput = z.output<typeof employeeOnboardingSchema>;

export const completeEmployeeSignupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Informe seu nome completo"),
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
  })
  .merge(employeeOnboardingSchema);

export type CompleteEmployeeSignupInput = z.output<typeof completeEmployeeSignupSchema>;

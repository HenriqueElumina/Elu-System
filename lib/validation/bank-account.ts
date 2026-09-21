import { z } from "zod";

export const bankAccountSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome/apelido pra conta"),
  bankName: z.string().trim().min(2, "Informe o banco"),
  agency: z.string().trim().min(1, "Informe a agência"),
  accountNumber: z.string().trim().min(1, "Informe o número da conta"),
});

export type BankAccountInput = z.output<typeof bankAccountSchema>;
export type BankAccountFormInput = z.input<typeof bankAccountSchema>;

import { z } from "zod";
import { isValidDocument } from "./document";

export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "linkedin",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

const socialAccountSchema = z
  .object({
    handle: z.string().trim().max(100).optional().or(z.literal("")),
    followersCount: z.coerce
      .number()
      .int()
      .min(0)
      .max(1_000_000_000)
      .optional(),
  })
  .refine(
    (value) => !(value.handle && value.followersCount === undefined),
    { message: "Informe também os seguidores/inscritos", path: ["followersCount"] },
  );

const otherSocialAccountSchema = socialAccountSchema.and(
  z.object({
    label: z.string().trim().max(60).optional().or(z.literal("")),
  }),
);

const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome completo"),
  roleTitle: z.string().trim().max(100).optional().or(z.literal("")),
  email: z.string().trim().email("E-mail inválido"),
  phone: z.string().trim().min(8, "Informe um telefone válido"),
});

export const clientIntakeSchema = z
  .object({
    legalName: z.string().trim().min(3, "Informe a razão social"),
    tradeName: z.string().trim().max(150).optional().or(z.literal("")),
    documentType: z.enum(["cnpj", "cpf"]),
    document: z.string().trim().min(11, "Documento inválido"),
    email: z.string().trim().email("E-mail inválido").optional().or(z.literal("")),
    phone: z.string().trim().min(8, "Informe um telefone válido"),

    addressZipCode: z.string().trim().min(8, "CEP inválido"),
    addressStreet: z.string().trim().min(2, "Informe o logradouro"),
    addressNumber: z.string().trim().min(1, "Informe o número"),
    addressComplement: z.string().trim().max(100).optional().or(z.literal("")),
    addressNeighborhood: z.string().trim().min(2, "Informe o bairro"),
    addressCity: z.string().trim().min(2, "Informe a cidade"),
    addressState: z
      .string()
      .trim()
      .length(2, "UF deve ter 2 letras")
      .toUpperCase(),

    primaryContact: contactSchema,

    billingSameAsPrimary: z.boolean(),
    billingContact: contactSchema.partial().optional(),

    social: z.object({
      instagram: socialAccountSchema.optional(),
      facebook: socialAccountSchema.optional(),
      tiktok: socialAccountSchema.optional(),
      youtube: socialAccountSchema.optional(),
      linkedin: socialAccountSchema.optional(),
      other: otherSocialAccountSchema.optional(),
    }),
  })
  .refine((value) => isValidDocument(value.document, value.documentType), {
    message: "Documento inválido para o tipo selecionado",
    path: ["document"],
  })
  .refine(
    (value) =>
      value.billingSameAsPrimary ||
      (value.billingContact?.name &&
        value.billingContact?.email &&
        contactSchema.pick({ email: true }).safeParse({
          email: value.billingContact.email,
        }).success),
    {
      message: "Informe nome e e-mail do contato financeiro",
      path: ["billingContact"],
    },
  );

// Tipo "de saída": o que sobra depois do Zod validar e coagir (ex.:
// followersCount vira number). É o que os handlers de submit recebem.
export type ClientIntakeInput = z.output<typeof clientIntakeSchema>;
// Tipo "de entrada": o que o react-hook-form guarda no estado do
// formulário antes da validação (ex.: followersCount ainda não é number).
export type ClientIntakeFormInput = z.input<typeof clientIntakeSchema>;

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
};

export type SocialAccountPayload = {
  platform: SocialPlatform | "other";
  platformOtherLabel?: string;
  handle?: string;
  followersCount?: number;
};

// Só manda pro banco as redes que o usuário de fato preencheu (tem @).
export function buildSocialAccountsPayload(
  input: ClientIntakeInput,
): SocialAccountPayload[] {
  const entries: SocialAccountPayload[] = [];

  for (const platform of SOCIAL_PLATFORMS) {
    const entry = input.social[platform];
    if (entry?.handle) {
      entries.push({
        platform,
        handle: entry.handle,
        followersCount:
          typeof entry.followersCount === "number" &&
          !Number.isNaN(entry.followersCount)
            ? entry.followersCount
            : undefined,
      });
    }
  }

  const other = input.social.other;
  if (other?.handle || other?.label) {
    entries.push({
      platform: "other",
      platformOtherLabel: other.label || "Outra",
      handle: other.handle,
      followersCount:
        typeof other.followersCount === "number" &&
        !Number.isNaN(other.followersCount)
          ? other.followersCount
          : undefined,
    });
  }

  return entries;
}

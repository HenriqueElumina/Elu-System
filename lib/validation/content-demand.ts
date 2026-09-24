import { z } from "zod";

export const CONTENT_DEMAND_STATUSES = [
  "draft",
  "in_production",
  "awaiting_approval",
  "approved_scheduled",
  "completed",
] as const;

export const CONTENT_DEMAND_STATUS_LABELS: Record<
  (typeof CONTENT_DEMAND_STATUSES)[number],
  string
> = {
  draft: "Rascunho",
  in_production: "Em produção",
  awaiting_approval: "Aguardando aprovação",
  approved_scheduled: "Aprovado/Agendado",
  completed: "Concluído",
};

// Só marcador visual nesta etapa — sem integração de postagem real.
// Lista fixa em código (não é enum no banco) pra dar pra ajustar sem
// migration.
export const CONTENT_CHANNELS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" },
  { key: "youtube", label: "YouTube" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "pinterest", label: "Pinterest" },
  { key: "x", label: "X (Twitter)" },
  { key: "threads", label: "Threads" },
  { key: "google_meu_negocio", label: "Google Meu Negócio" },
  { key: "blog_site", label: "Blog/Site" },
] as const;

export const createContentDemandSchema = z.object({
  title: z.string().trim().min(2, "Informe o título da demanda"),
  clientId: z.string().uuid("Selecione o cliente"),
  assignedTo: z.string().uuid().optional().or(z.literal("")),
  channels: z.array(z.string()).default([]),
  scheduledAt: z.string().optional().or(z.literal("")),
  briefing: z.string().trim().max(5000).optional().or(z.literal("")),
  mediaUrl: z
    .string()
    .trim()
    .url("Link inválido")
    .optional()
    .or(z.literal("")),
  tags: z.string().trim().max(300).optional().or(z.literal("")),
});

export type CreateContentDemandInput = z.output<typeof createContentDemandSchema>;
export type CreateContentDemandFormInput = z.input<typeof createContentDemandSchema>;

export function parseTags(tags: string | undefined): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

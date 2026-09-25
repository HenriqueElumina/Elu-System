import { CONTENT_CHANNELS } from "@/lib/validation/content-demand";

export const CHANNEL_LABELS = Object.fromEntries(
  CONTENT_CHANNELS.map((channel) => [channel.key, channel.label]),
);

export function formatScheduledAt(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function channelsLabel(channels: string[] | null): string {
  return channels && channels.length > 0
    ? channels.map((key) => CHANNEL_LABELS[key] ?? key).join(" · ")
    : "Canal não informado";
}

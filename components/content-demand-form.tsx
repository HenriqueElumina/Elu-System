"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createContentDemandSchema,
  CONTENT_CHANNELS,
  type CreateContentDemandFormInput,
  type CreateContentDemandInput,
} from "@/lib/validation/content-demand";

type SubmitResult = { ok: true } | { ok: false; message: string };

export function ContentDemandForm({
  clients,
  assignees,
  onSubmit,
  submitLabel = "Criar demanda",
}: {
  clients: { id: string; legal_name: string }[];
  assignees: { id: string; full_name: string }[];
  onSubmit: (data: CreateContentDemandInput) => Promise<SubmitResult>;
  submitLabel?: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateContentDemandFormInput, unknown, CreateContentDemandInput>({
    resolver: zodResolver(createContentDemandSchema),
    defaultValues: {
      title: "",
      clientId: "",
      assignedTo: "",
      channels: [],
      scheduledAt: "",
      briefing: "",
      mediaUrl: "",
      tags: "",
      caption: "",
    },
  });

  async function submit(data: CreateContentDemandInput) {
    setServerError(null);
    const result = await onSubmit(data);
    if (!result.ok) setServerError(result.message);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Field label="Título da demanda" error={errors.title?.message}>
        <input {...register("title")} className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cliente" error={errors.clientId?.message}>
          <select {...register("clientId")} className={inputClass}>
            <option value="">Selecione...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.legal_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Responsável (opcional)">
          <select {...register("assignedTo")} className={inputClass}>
            <option value="">Sem responsável ainda</option>
            {assignees.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="space-y-1">
        <span className="text-sm font-medium">Canais</span>
        <Controller
          control={control}
          name="channels"
          render={({ field }) => (
            <div className="flex flex-wrap gap-3">
              {CONTENT_CHANNELS.map((channel) => {
                const checked = (field.value ?? []).includes(channel.key);
                return (
                  <label
                    key={channel.key}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        const current = field.value ?? [];
                        field.onChange(
                          event.target.checked
                            ? [...current, channel.key]
                            : current.filter((key) => key !== channel.key),
                        );
                      }}
                    />
                    {channel.label}
                  </label>
                );
              })}
            </div>
          )}
        />
      </div>

      <Field
        label="Data prevista para publicação (opcional)"
        error={errors.scheduledAt?.message}
      >
        <input
          type="datetime-local"
          {...register("scheduledAt")}
          className={inputClass}
        />
      </Field>

      <Field
        label="Link do material bruto (opcional)"
        error={errors.mediaUrl?.message}
      >
        <input
          placeholder="https://drive.google.com/..."
          {...register("mediaUrl")}
          className={inputClass}
        />
      </Field>

      <Field label="Tags (separadas por vírgula, opcional)">
        <input {...register("tags")} className={inputClass} />
      </Field>

      <Field
        label="Legenda (texto final do post, opcional)"
        error={errors.caption?.message}
      >
        <textarea rows={4} {...register("caption")} className={inputClass} />
      </Field>

      <Field label="Briefing (opcional)" error={errors.briefing?.message}>
        <textarea rows={5} {...register("briefing")} className={inputClass} />
      </Field>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span className="block text-sm text-red-600">{error}</span>}
    </label>
  );
}

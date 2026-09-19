"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  leadSchema,
  type LeadFormInput,
  type LeadInput,
} from "@/lib/validation/lead";

type SubmitResult = { ok: true } | { ok: false; message: string };

export function LeadForm({
  defaultValues,
  onSubmit,
  submitLabel = "Salvar",
}: {
  defaultValues?: Partial<LeadFormInput>;
  onSubmit: (data: LeadInput) => Promise<SubmitResult>;
  submitLabel?: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormInput, unknown, LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      ...defaultValues,
    },
  });

  async function submit(data: LeadInput) {
    setServerError(null);
    const result = await onSubmit(data);
    if (!result.ok) setServerError(result.message);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Field label="Nome da empresa" error={errors.companyName?.message}>
        <input {...register("companyName")} className={inputClass} />
      </Field>
      <Field label="Nome do contato" error={errors.contactName?.message}>
        <input {...register("contactName")} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="E-mail do contato" error={errors.contactEmail?.message}>
          <input {...register("contactEmail")} className={inputClass} />
        </Field>
        <Field label="Telefone do contato" error={errors.contactPhone?.message}>
          <input {...register("contactPhone")} className={inputClass} />
        </Field>
      </div>

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

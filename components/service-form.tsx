"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BILLING_TYPES,
  BILLING_TYPE_LABELS,
  SERVICE_LINES,
  SERVICE_LINE_LABELS,
  serviceSchema,
  type ServiceFormInput,
  type ServiceInput,
} from "@/lib/validation/service";

type SubmitResult = { ok: true } | { ok: false; message: string };

export function ServiceForm({
  defaultValues,
  onSubmit,
  submitLabel = "Salvar",
}: {
  defaultValues?: Partial<ServiceFormInput>;
  onSubmit: (data: ServiceInput) => Promise<SubmitResult>;
  submitLabel?: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormInput, unknown, ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      serviceLine: "social_media",
      billingType: "recurring_monthly",
      basePriceReais: 0,
      active: true,
      ...defaultValues,
    },
  });

  async function submit(data: ServiceInput) {
    setServerError(null);
    const result = await onSubmit(data);
    if (!result.ok) {
      setServerError(result.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Field label="Nome do serviço" error={errors.name?.message}>
        <input {...register("name")} className={inputClass} />
      </Field>

      <Field label="Descrição" error={errors.description?.message}>
        <textarea {...register("description")} rows={3} className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Linha de negócio" error={errors.serviceLine?.message}>
          <select {...register("serviceLine")} className={inputClass}>
            {SERVICE_LINES.map((line) => (
              <option key={line} value={line}>
                {SERVICE_LINE_LABELS[line]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tipo de cobrança" error={errors.billingType?.message}>
          <select {...register("billingType")} className={inputClass}>
            {BILLING_TYPES.map((type) => (
              <option key={type} value={type}>
                {BILLING_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Preço (R$)" error={errors.basePriceReais?.message}>
        <input
          type="number"
          step="0.01"
          min="0"
          {...register("basePriceReais")}
          className={inputClass}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("active")} />
        Ativo (aparece disponível pra venda)
      </label>

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

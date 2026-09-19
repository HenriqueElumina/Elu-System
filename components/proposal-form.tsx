"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  proposalSchema,
  type ProposalFormInput,
  type ProposalInput,
} from "@/lib/validation/proposal";
import { centsToReais } from "@/lib/validation/service";

type SubmitResult = { ok: true } | { ok: false; message: string };

type ServiceOption = {
  id: string;
  name: string;
  base_price_cents: number;
};

export function ProposalForm({
  services,
  defaultValues,
  onSubmit,
  submitLabel = "Salvar proposta",
}: {
  services: ServiceOption[];
  defaultValues?: Partial<ProposalFormInput>;
  onSubmit: (data: ProposalInput) => Promise<SubmitResult>;
  submitLabel?: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProposalFormInput, unknown, ProposalInput>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      notes: "",
      items: [{ serviceId: "", quantity: 1, unitPriceReais: 0 }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");

  const total = items.reduce((sum, item) => {
    const quantity = Number(item?.quantity) || 0;
    const unitPrice = Number(item?.unitPriceReais) || 0;
    return sum + quantity * unitPrice;
  }, 0);

  async function submit(data: ProposalInput) {
    setServerError(null);
    const result = await onSubmit(data);
    if (!result.ok) setServerError(result.message);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-[1fr_100px_140px_auto] items-end gap-3 rounded-md border border-gray-200 p-3"
          >
            <label className="block space-y-1">
              <span className="text-sm font-medium">Serviço</span>
              <select
                {...register(`items.${index}.serviceId`)}
                onChange={(event) => {
                  const service = services.find(
                    (s) => s.id === event.target.value,
                  );
                  setValue(
                    `items.${index}.serviceId`,
                    event.target.value,
                  );
                  if (service) {
                    setValue(
                      `items.${index}.unitPriceReais`,
                      centsToReais(service.base_price_cents),
                    );
                  }
                }}
                className={inputClass}
              >
                <option value="">Selecione...</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              {errors.items?.[index]?.serviceId && (
                <span className="block text-sm text-red-600">
                  {errors.items[index]?.serviceId?.message}
                </span>
              )}
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Qtd.</span>
              <input
                type="number"
                min={1}
                {...register(`items.${index}.quantity`)}
                className={inputClass}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Preço (R$)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                {...register(`items.${index}.unitPriceReais`)}
                className={inputClass}
              />
            </label>

            <button
              type="button"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-30"
            >
              Remover
            </button>
          </div>
        ))}

        {errors.items?.message && (
          <p className="text-sm text-red-600">{errors.items.message}</p>
        )}

        <button
          type="button"
          onClick={() => append({ serviceId: "", quantity: 1, unitPriceReais: 0 })}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          + Adicionar serviço
        </button>
      </div>

      <p className="text-sm font-medium">
        Total:{" "}
        {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </p>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Observações</span>
        <textarea {...register("notes")} rows={3} className={inputClass} />
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

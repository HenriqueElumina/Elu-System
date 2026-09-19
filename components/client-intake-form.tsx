"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  clientIntakeSchema,
  type ClientIntakeFormInput,
  type ClientIntakeInput,
  SOCIAL_PLATFORM_LABELS,
  type SocialPlatform,
} from "@/lib/validation/client-intake";

const SOCIAL_PLATFORMS = Object.keys(
  SOCIAL_PLATFORM_LABELS,
) as SocialPlatform[];

const defaultFormValues: ClientIntakeFormInput = {
  legalName: "",
  tradeName: "",
  documentType: "cnpj",
  document: "",
  email: "",
  phone: "",
  addressZipCode: "",
  addressStreet: "",
  addressNumber: "",
  addressComplement: "",
  addressNeighborhood: "",
  addressCity: "",
  addressState: "",
  primaryContact: { name: "", roleTitle: "", email: "", phone: "" },
  billingSameAsPrimary: true,
  billingContact: { name: "", roleTitle: "", email: "", phone: "" },
  social: {},
};

type SubmitResult = { ok: true } | { ok: false; message: string };

export function ClientIntakeForm({
  onSubmit,
  submitLabel = "Enviar",
  successMessage = "Dados enviados com sucesso.",
}: {
  onSubmit: (data: ClientIntakeInput) => Promise<SubmitResult>;
  submitLabel?: string;
  successMessage?: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientIntakeFormInput, unknown, ClientIntakeInput>({
    resolver: zodResolver(clientIntakeSchema),
    defaultValues: defaultFormValues,
  });

  const billingSameAsPrimary = watch("billingSameAsPrimary");

  async function submit(data: ClientIntakeInput) {
    setServerError(null);
    const result = await onSubmit(data);
    if (result.ok) {
      setSuccess(true);
    } else {
      setServerError(result.message);
    }
  }

  if (success) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-6 text-sm text-green-800">
        {successMessage}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-8">
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold">Dados da empresa</legend>

        <Field label="Razão social" error={errors.legalName?.message}>
          <input {...register("legalName")} className={inputClass} />
        </Field>

        <Field label="Nome fantasia" error={errors.tradeName?.message}>
          <input {...register("tradeName")} className={inputClass} />
        </Field>

        <div className="grid grid-cols-[140px_1fr] gap-4">
          <Field label="Tipo" error={errors.documentType?.message}>
            <select {...register("documentType")} className={inputClass}>
              <option value="cnpj">CNPJ</option>
              <option value="cpf">CPF</option>
            </select>
          </Field>
          <Field label="Número do documento" error={errors.document?.message}>
            <input {...register("document")} className={inputClass} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="E-mail da empresa" error={errors.email?.message}>
            <input {...register("email")} className={inputClass} />
          </Field>
          <Field label="Telefone da empresa" error={errors.phone?.message}>
            <input {...register("phone")} className={inputClass} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold">Endereço</legend>

        <div className="grid grid-cols-[160px_1fr] gap-4">
          <Field label="CEP" error={errors.addressZipCode?.message}>
            <input {...register("addressZipCode")} className={inputClass} />
          </Field>
          <Field label="Logradouro" error={errors.addressStreet?.message}>
            <input {...register("addressStreet")} className={inputClass} />
          </Field>
        </div>

        <div className="grid grid-cols-[140px_1fr] gap-4">
          <Field label="Número" error={errors.addressNumber?.message}>
            <input {...register("addressNumber")} className={inputClass} />
          </Field>
          <Field
            label="Complemento"
            error={errors.addressComplement?.message}
          >
            <input
              {...register("addressComplement")}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-[1fr_1fr_80px] gap-4">
          <Field
            label="Bairro"
            error={errors.addressNeighborhood?.message}
          >
            <input
              {...register("addressNeighborhood")}
              className={inputClass}
            />
          </Field>
          <Field label="Cidade" error={errors.addressCity?.message}>
            <input {...register("addressCity")} className={inputClass} />
          </Field>
          <Field label="UF" error={errors.addressState?.message}>
            <input
              {...register("addressState")}
              maxLength={2}
              className={inputClass}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold">Contato principal</legend>

        <Field
          label="Nome completo"
          error={errors.primaryContact?.name?.message}
        >
          <input {...register("primaryContact.name")} className={inputClass} />
        </Field>
        <Field
          label="Cargo"
          error={errors.primaryContact?.roleTitle?.message}
        >
          <input
            {...register("primaryContact.roleTitle")}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="E-mail"
            error={errors.primaryContact?.email?.message}
          >
            <input
              {...register("primaryContact.email")}
              className={inputClass}
            />
          </Field>
          <Field
            label="Telefone"
            error={errors.primaryContact?.phone?.message}
          >
            <input
              {...register("primaryContact.phone")}
              className={inputClass}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold">Contato financeiro</legend>
        <p className="text-sm text-gray-500">
          Quem vai receber boleto e nota fiscal.
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("billingSameAsPrimary")} />
          É a mesma pessoa do contato principal
        </label>

        {!billingSameAsPrimary && (
          <>
            <Field
              label="Nome completo"
              error={errors.billingContact?.name?.message}
            >
              <input
                {...register("billingContact.name")}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="E-mail"
                error={errors.billingContact?.email?.message}
              >
                <input
                  {...register("billingContact.email")}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Telefone"
                error={errors.billingContact?.phone?.message}
              >
                <input
                  {...register("billingContact.phone")}
                  className={inputClass}
                />
              </Field>
            </div>
          </>
        )}
        {errors.billingContact && (
          <p className="text-sm text-red-600">
            {errors.billingContact.message as string | undefined}
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold">Redes sociais</legend>
        <p className="text-sm text-gray-500">
          Preencha só o que se aplica — é o número de seguidores/inscritos
          hoje, na assinatura do contrato.
        </p>

        {SOCIAL_PLATFORMS.map((platform) => (
          <div key={platform} className="grid grid-cols-[140px_1fr_140px] gap-4">
            <span className="pt-2 text-sm font-medium">
              {SOCIAL_PLATFORM_LABELS[platform]}
            </span>
            <Field label="Usuário (@)">
              <input
                {...register(`social.${platform}.handle`)}
                className={inputClass}
              />
            </Field>
            <Field label="Seguidores/inscritos">
              <input
                type="number"
                min={0}
                {...register(`social.${platform}.followersCount`)}
                className={inputClass}
              />
            </Field>
          </div>
        ))}

        <div className="grid grid-cols-[140px_1fr_1fr_140px] gap-4">
          <span className="pt-2 text-sm font-medium">Outra rede</span>
          <Field label="Nome da rede">
            <input
              {...register("social.other.label")}
              className={inputClass}
            />
          </Field>
          <Field label="Usuário (@)">
            <input
              {...register("social.other.handle")}
              className={inputClass}
            />
          </Field>
          <Field label="Seguidores/inscritos">
            <input
              type="number"
              min={0}
              {...register("social.other.followersCount")}
              className={inputClass}
            />
          </Field>
        </div>
      </fieldset>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Enviando..." : submitLabel}
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

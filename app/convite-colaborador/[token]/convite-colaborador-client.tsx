"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  completeEmployeeSignupSchema,
  type CompleteEmployeeSignupInput,
} from "@/lib/validation/employee";

type InviteState =
  | { status: "loading" }
  | { status: "invalid"; reason: string }
  | { status: "ready"; email: string }
  | { status: "done"; needsEmailConfirmation: boolean };

type OnboardingFields = Omit<CompleteEmployeeSignupInput, "fullName" | "password">;

const EMPTY_ONBOARDING: Record<keyof OnboardingFields, string> = {
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "",
  dietaryRestrictions: "",
  careerGoals: "",
  birthDate: "",
  document: "",
  addressZipCode: "",
  addressStreet: "",
  addressNumber: "",
  addressComplement: "",
  addressNeighborhood: "",
  addressCity: "",
  addressState: "",
};

const INVALID_REASON_MESSAGES: Record<string, string> = {
  not_found: "Este link não é válido. Confira com quem te enviou.",
  already_submitted: "Este link já foi usado — sua conta já deve existir.",
  expired: "Este link expirou. Peça um novo link pra agência.",
};

export function ConviteColaboradorClient({ token }: { token: string }) {
  const [state, setState] = useState<InviteState>({ status: "loading" });
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [onboarding, setOnboarding] = useState(EMPTY_ONBOARDING);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase
        .rpc("get_employee_invite", { p_token: token })
        .single<{ valid: boolean; reason: string | null; email: string | null }>();

      if (cancelled) return;

      if (rpcError || !data) {
        setState({ status: "invalid", reason: "not_found" });
        return;
      }

      if (!data.valid || !data.email) {
        setState({ status: "invalid", reason: data.reason ?? "not_found" });
        return;
      }

      setState({ status: "ready", email: data.email });
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function updateOnboarding(field: keyof OnboardingFields, value: string) {
    setOnboarding((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state.status !== "ready") return;

    const parsed = completeEmployeeSignupSchema.safeParse({
      fullName,
      password,
      ...onboarding,
    } satisfies CompleteEmployeeSignupInput);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    const data = parsed.data;

    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: state.email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (signUpError || !signUpData.user) {
      setBusy(false);
      setError(signUpError?.message ?? "Erro ao criar a conta.");
      return;
    }

    const { error: submitError } = await supabase.rpc("submit_employee_invite", {
      p_token: token,
      p_profile_id: signUpData.user.id,
      p_emergency_contact_name: data.emergencyContactName ?? "",
      p_emergency_contact_phone: data.emergencyContactPhone ?? "",
      p_emergency_contact_relationship: data.emergencyContactRelationship ?? "",
      p_dietary_restrictions: data.dietaryRestrictions ?? "",
      p_career_goals: data.careerGoals ?? "",
      p_birth_date: data.birthDate || null,
      p_document: data.document ?? "",
      p_address_zip_code: data.addressZipCode ?? "",
      p_address_street: data.addressStreet ?? "",
      p_address_number: data.addressNumber ?? "",
      p_address_complement: data.addressComplement ?? "",
      p_address_neighborhood: data.addressNeighborhood ?? "",
      p_address_city: data.addressCity ?? "",
      p_address_state: data.addressState ?? "",
    });

    setBusy(false);

    if (submitError) {
      setError(
        `Sua conta foi criada, mas houve um erro ao concluir o cadastro: ${submitError.message}. Fale com quem te convidou.`,
      );
      return;
    }

    setState({ status: "done", needsEmailConfirmation: !signUpData.session });
  }

  if (state.status === "loading") {
    return <p className="text-sm text-gray-500">Carregando...</p>;
  }

  if (state.status === "invalid") {
    return (
      <p className="text-sm text-red-600">
        {INVALID_REASON_MESSAGES[state.reason] ?? INVALID_REASON_MESSAGES.not_found}
      </p>
    );
  }

  if (state.status === "done") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-700">Conta criada com sucesso!</p>
        {state.needsEmailConfirmation ? (
          <p className="text-sm text-gray-600">
            Confira seu e-mail pra confirmar a conta antes de entrar.
          </p>
        ) : (
          <p className="text-sm text-gray-600">Você já pode entrar.</p>
        )}
        <Link href="/login" className="text-sm font-medium underline">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Dados de acesso</h2>
        <label className="block space-y-1">
          <span className="text-sm font-medium">E-mail</span>
          <input
            readOnly
            value={state.email}
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Nome completo</span>
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Senha</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">
          Contato de emergência (opcional)
        </h2>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Nome</span>
          <input
            type="text"
            value={onboarding.emergencyContactName}
            onChange={(event) => updateOnboarding("emergencyContactName", event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <div className="flex gap-2">
          <label className="block flex-1 space-y-1">
            <span className="text-sm font-medium">Telefone</span>
            <input
              type="text"
              value={onboarding.emergencyContactPhone}
              onChange={(event) => updateOnboarding("emergencyContactPhone", event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block flex-1 space-y-1">
            <span className="text-sm font-medium">Parentesco</span>
            <input
              type="text"
              value={onboarding.emergencyContactRelationship}
              onChange={(event) =>
                updateOnboarding("emergencyContactRelationship", event.target.value)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Ex.: mãe, cônjuge"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">
          Saúde e objetivos (opcional)
        </h2>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Restrições alimentares / alergias</span>
          <input
            type="text"
            value={onboarding.dietaryRestrictions}
            onChange={(event) => updateOnboarding("dietaryRestrictions", event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Objetivos de carreira</span>
          <textarea
            value={onboarding.careerGoals}
            onChange={(event) => updateOnboarding("careerGoals", event.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Dados pessoais (opcional)</h2>
        <div className="flex gap-2">
          <label className="block flex-1 space-y-1">
            <span className="text-sm font-medium">Data de nascimento</span>
            <input
              type="date"
              value={onboarding.birthDate}
              onChange={(event) => updateOnboarding("birthDate", event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block flex-1 space-y-1">
            <span className="text-sm font-medium">CPF</span>
            <input
              type="text"
              value={onboarding.document}
              onChange={(event) => updateOnboarding("document", event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-medium">CEP</span>
          <input
            type="text"
            value={onboarding.addressZipCode}
            onChange={(event) => updateOnboarding("addressZipCode", event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <div className="flex gap-2">
          <label className="block flex-[3] space-y-1">
            <span className="text-sm font-medium">Rua</span>
            <input
              type="text"
              value={onboarding.addressStreet}
              onChange={(event) => updateOnboarding("addressStreet", event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block flex-1 space-y-1">
            <span className="text-sm font-medium">Número</span>
            <input
              type="text"
              value={onboarding.addressNumber}
              onChange={(event) => updateOnboarding("addressNumber", event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Complemento</span>
          <input
            type="text"
            value={onboarding.addressComplement}
            onChange={(event) => updateOnboarding("addressComplement", event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Bairro</span>
          <input
            type="text"
            value={onboarding.addressNeighborhood}
            onChange={(event) => updateOnboarding("addressNeighborhood", event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <div className="flex gap-2">
          <label className="block flex-[3] space-y-1">
            <span className="text-sm font-medium">Cidade</span>
            <input
              type="text"
              value={onboarding.addressCity}
              onChange={(event) => updateOnboarding("addressCity", event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block flex-1 space-y-1">
            <span className="text-sm font-medium">UF</span>
            <input
              type="text"
              maxLength={2}
              value={onboarding.addressState}
              onChange={(event) => updateOnboarding("addressState", event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}

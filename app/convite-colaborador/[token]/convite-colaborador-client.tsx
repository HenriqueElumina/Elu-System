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

const INVALID_REASON_MESSAGES: Record<string, string> = {
  not_found: "Este link não é válido. Confira com quem te enviou.",
  already_submitted: "Este link já foi usado — sua conta já deve existir.",
  expired: "Este link expirou. Peça um novo link pra agência.",
};

export function ConviteColaboradorClient({ token }: { token: string }) {
  const [state, setState] = useState<InviteState>({ status: "loading" });
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state.status !== "ready") return;

    const parsed = completeEmployeeSignupSchema.safeParse({
      fullName,
      password,
    } satisfies CompleteEmployeeSignupInput);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

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
    <form onSubmit={handleSubmit} className="space-y-4">
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

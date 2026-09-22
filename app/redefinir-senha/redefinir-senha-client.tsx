"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type PageState =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "ready" }
  | { status: "done" };

export function RedefinirSenhaClient() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let settled = false;
    const supabase = createClient();

    // O link de "esqueci minha senha" do Supabase é verificado no
    // servidor deles antes de redirecionar pra cá -- não chega com
    // ?code= (isso é só pro fluxo de confirmação de cadastro). O jeito
    // oficial de detectar recuperação de senha é este evento.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        settled = true;
        setState({ status: "ready" });
      }
    });

    // Mantido por segurança, caso o link algum dia venha no formato
    // ?code= (fluxo PKCE) em vez do formato padrão acima.
    async function tryCodeExchange() {
      const code = searchParams.get("code");
      if (!code) return;
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError) {
        settled = true;
        setState({ status: "ready" });
      }
    }
    tryCodeExchange();

    const timeout = setTimeout(() => {
      if (!settled) setState({ status: "invalid" });
    }, 2500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setState({ status: "done" });
  }

  if (state.status === "loading") {
    return <p className="text-sm text-gray-500">Carregando...</p>;
  }

  if (state.status === "invalid") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">
          Este link não é válido ou expirou. Peça um novo em &quot;Esqueci
          minha senha&quot; na tela de login.
        </p>
        <Link href="/login" className="text-sm font-medium underline">
          Ir para o login
        </Link>
      </div>
    );
  }

  if (state.status === "done") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-700">Senha atualizada com sucesso!</p>
        <Link href="/login" className="text-sm font-medium underline">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          Nova senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="confirm-password" className="text-sm font-medium">
          Confirmar nova senha
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}

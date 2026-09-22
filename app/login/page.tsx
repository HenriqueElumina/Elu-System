"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("E-mail ou senha inválidos.");
      return;
    }

    router.replace("/clientes");
    router.refresh();
  }

  async function handleForgotSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setForgotSent(true);
  }

  if (mode === "forgot") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <form
          onSubmit={handleForgotSubmit}
          className="w-full max-w-sm space-y-4 rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
        >
          <div>
            <h1 className="text-xl font-semibold">Redefinir senha</h1>
            <p className="text-sm text-gray-500">
              Informe seu e-mail e mandamos um link pra você trocar a senha.
            </p>
          </div>

          {forgotSent ? (
            <p className="text-sm text-gray-700">
              Se esse e-mail tiver uma conta, você vai receber um link em
              instantes.
            </p>
          ) : (
            <div className="space-y-1">
              <label htmlFor="forgot-email" className="text-sm font-medium">
                E-mail
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {!forgotSent && (
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setMode("login");
              setForgotSent(false);
              setError(null);
            }}
            className="w-full text-sm text-gray-500 underline-offset-2 hover:underline"
          >
            Voltar pro login
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold">Elu System</h1>
          <p className="text-sm text-gray-500">
            Entre com sua conta da Elumina Partners.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("forgot");
            setError(null);
          }}
          className="w-full text-sm text-gray-500 underline-offset-2 hover:underline"
        >
          Esqueci minha senha
        </button>
      </form>
    </main>
  );
}

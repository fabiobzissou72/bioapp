"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [agencyName, setAgencyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { agency_name: agencyName } },
    });

    setLoading(false);

    if (error || !data.user) {
      setError(error?.message || "Não foi possível criar a conta.");
      return;
    }

    if (!data.session) {
      // Email confirmation is required — the profile row is created by a DB
      // trigger on auth.users, so there's nothing else to do until they confirm.
      setAwaitingConfirmation(true);
      return;
    }

    router.push("/painel");
    router.refresh();
  }

  if (awaitingConfirmation) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-3 px-4 text-center">
        <div className="text-3xl">📩</div>
        <h1 className="text-xl font-bold text-neutral-900">Confirme seu e-mail</h1>
        <p className="text-sm text-neutral-500">
          Enviamos um link de confirmação para {email}. Depois de confirmar, faça login normalmente.
        </p>
        <Link href="/login" className="mt-2 font-medium text-pink-600">
          Ir para login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-5 px-4">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Criar conta</h1>
        <p className="mt-1 text-sm text-neutral-500">Crie sua agência e comece a montar biosites.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required
          value={agencyName}
          onChange={(e) => setAgencyName(e.target.value)}
          placeholder="Nome da sua agência"
          className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-pink-600 px-5 py-3 font-medium text-white shadow disabled:opacity-40"
        >
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>
      <p className="text-center text-sm text-neutral-500">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-pink-600">
          Entrar
        </Link>
      </p>
    </main>
  );
}

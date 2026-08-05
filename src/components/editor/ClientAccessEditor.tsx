"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ClientAccess = { email: string };

export function ClientAccessEditor({
  biositeId,
  accesses,
}: {
  biositeId: string;
  accesses: ClientAccess[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function grantAccess() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/client-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ biositeId, email, password }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Erro ao criar acesso.");
      return;
    }
    setEmail("");
    setPassword("");
    router.refresh();
  }

  async function revokeAccess(accessEmail: string) {
    await fetch("/api/client-access", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ biositeId, email: accessEmail }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-neutral-500">
        Crie um login pra dona/dono desse negócio acompanhar os agendamentos em bioapp.vercel.app/cliente,
        separado do seu acesso de agência.
      </p>

      {accesses.map((a) => (
        <div
          key={a.email}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        >
          <span className="flex-1">{a.email}</span>
          <button onClick={() => revokeAccess(a.email)} className="text-red-500">
            remover
          </button>
        </div>
      ))}

      <div className="flex flex-wrap gap-2 rounded-lg border border-neutral-200 p-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="E-mail do cliente"
          className="min-w-40 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="text"
          placeholder="Senha (você define e passa pro cliente)"
          className="min-w-40 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
        />
        <button
          onClick={grantAccess}
          disabled={saving || !email || !password}
          className="rounded-full bg-pink-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {saving ? "Criando..." : "Criar acesso"}
        </button>
        {error && <p className="w-full text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}

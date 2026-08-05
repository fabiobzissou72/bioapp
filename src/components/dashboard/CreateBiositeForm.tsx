"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slugify";

export function CreateBiositeForm({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("biosites")
      .insert({ owner_id: user.id, business_name: name, slug: slugify(slug) })
      .select("id")
      .single();

    setLoading(false);
    if (error) {
      setError(error.code === "23505" ? "Esse endereço já está em uso." : "Erro ao criar biosite.");
      return;
    }

    router.push(`/painel/${data.id}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="w-full rounded-xl border-2 border-dashed border-neutral-200 py-4 text-sm font-medium text-neutral-500 hover:border-pink-300 hover:text-pink-600 disabled:opacity-40"
      >
        + Criar novo biosite
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4">
      <input
        required
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        placeholder="Nome do negócio"
        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
      />
      <div className="flex items-center gap-1 text-sm text-neutral-500">
        <span>bioapp.vercel.app/</span>
        <input
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          className="flex-1 rounded-lg border border-neutral-200 px-2 py-1 text-sm outline-none focus:border-neutral-400"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-pink-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {loading ? "Criando..." : "Criar"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-5 py-2 text-sm font-medium text-neutral-500"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

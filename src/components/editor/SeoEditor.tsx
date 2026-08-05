"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Biosite } from "@/lib/types";

export function SeoEditor({ biosite }: { biosite: Biosite }) {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState(biosite.seo_title || "");
  const [description, setDescription] = useState(biosite.seo_description || "");
  const [keywords, setKeywords] = useState(biosite.seo_keywords || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("biosites")
      .update({
        seo_title: title || null,
        seo_description: description || null,
        seo_keywords: keywords || null,
      })
      .eq("id", biosite.id);
    setSaving(false);
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4">
      <p className="text-xs text-neutral-500">
        Controla como esse biosite aparece no Google e quando compartilhado (WhatsApp, redes sociais). Deixe
        em branco pra usar o nome/descrição do negócio automaticamente.
      </p>
      <label className="flex flex-col gap-1 text-sm text-neutral-600">
        Título para o Google
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={biosite.business_name}
          maxLength={70}
          className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-600">
        Meta descrição
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Resumo curto que aparece no resultado de busca do Google (até 160 caracteres)"
          maxLength={160}
          className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-600">
        Palavras-chave
        <input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Ex: manicure, unhas, esmalteria, nome da cidade"
          className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm outline-none"
        />
        <span className="text-xs text-neutral-400">Separe por vírgula.</span>
      </label>

      <button
        onClick={handleSave}
        disabled={saving}
        className="self-start rounded-full bg-pink-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </section>
  );
}

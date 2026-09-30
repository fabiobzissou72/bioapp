"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slugify";

type CloneOption = { id: string; business_name: string };

export function CreateBiositeForm({
  disabled,
  cloneOptions,
}: {
  disabled: boolean;
  cloneOptions: CloneOption[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [cloneFrom, setCloneFrom] = useState<string | null>(null);
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

    // Cloning copies the source biosite's look (colors, theme, template) plus its
    // buttons and catalog, like "Modelo" does in the reference product — so the new
    // biosite isn't starting from a blank page.
    let styleFields: Partial<{
      template: string;
      primary_color: string;
      button_text_color: string | null;
      theme: "light" | "dark";
      logo_shape: "round" | "square";
    }> = {};

    if (cloneFrom) {
      const { data: source } = await supabase
        .from("biosites")
        .select("template, primary_color, button_text_color, theme, logo_shape")
        .eq("id", cloneFrom)
        .eq("owner_id", user.id)
        .single();
      if (source) styleFields = source;
    }

    const { data, error } = await supabase
      .from("biosites")
      .insert({ owner_id: user.id, business_name: name, slug: slugify(slug), ...styleFields })
      .select("id")
      .single();

    if (error) {
      setLoading(false);
      setError(error.code === "23505" ? "Esse endereço já está em uso." : "Erro ao criar biosite.");
      return;
    }

    if (cloneFrom) {
      await cloneButtonsAndCatalog(supabase, cloneFrom, data.id);
    }

    // Availability is keyed off staff_id, so a solo owner needs at least one
    // default "professional" to be able to set weekly hours right away —
    // they can rename it or add more people later.
    await supabase.from("staff").insert({ biosite_id: data.id, name: "Profissional" });

    setLoading(false);
    router.push(`/painel/${data.id}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="w-full rounded-xl border-2 border-dashed border-neutral-200 py-4 text-sm font-medium text-neutral-500 hover:border-[#191970]/40 hover:text-[#191970] disabled:opacity-40"
      >
        + Criar novo biosite
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4">
      {cloneOptions.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-700">
            Modelo <span className="font-normal text-neutral-400">(opcional)</span>
          </p>
          <p className="mb-2 text-xs text-neutral-500">
            Escolha um dos seus biosites como ponto de partida — cores, botões e catálogo já vêm prontos,
            você só troca as informações do novo negócio.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCloneFrom(null)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                cloneFrom === null
                  ? "border-[#191970] bg-[#191970] text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
              }`}
            >
              Do zero
            </button>
            {cloneOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCloneFrom(opt.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  cloneFrom === opt.id
                    ? "border-[#191970] bg-[#191970] text-white"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                }`}
              >
                {opt.business_name}
              </button>
            ))}
          </div>
        </div>
      )}

      <input
        required
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        placeholder="Nome do negócio"
        className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
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
          className="flex-1 rounded-lg border border-neutral-200 bg-white text-neutral-900 px-2 py-1 text-sm outline-none focus:border-neutral-400"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[#191970] px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
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

async function cloneButtonsAndCatalog(
  supabase: ReturnType<typeof createClient>,
  sourceBiositeId: string,
  targetBiositeId: string,
) {
  const { data: buttons } = await supabase
    .from("buttons")
    .select("type, label, url, color, style, pulse, position, config")
    .eq("biosite_id", sourceBiositeId);

  if (buttons?.length) {
    await supabase
      .from("buttons")
      .insert(buttons.map((b) => ({ ...b, biosite_id: targetBiositeId })));
  }

  const { data: groups } = await supabase
    .from("catalog_groups")
    .select("id, name, enabled, layout, interval_seconds, position")
    .eq("biosite_id", sourceBiositeId);

  for (const group of groups || []) {
    const { id: sourceGroupId, ...groupFields } = group;
    const { data: newGroup } = await supabase
      .from("catalog_groups")
      .insert({ ...groupFields, biosite_id: targetBiositeId })
      .select("id")
      .single();
    if (!newGroup) continue;

    const { data: items } = await supabase
      .from("catalog_items")
      .select(
        "media_type, media_url, poster_url, item_type, aspect, object_fit, title, description, cta_label, cta_url, cta_align, position",
      )
      .eq("group_id", sourceGroupId);

    if (items?.length) {
      await supabase
        .from("catalog_items")
        .insert(items.map((item) => ({ ...item, group_id: newGroup.id })));
    }
  }
}

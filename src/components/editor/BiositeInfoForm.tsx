"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadMedia } from "@/lib/upload";
import type { Biosite } from "@/lib/types";

export function BiositeInfoForm({ biosite }: { biosite: Biosite }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(biosite.business_name);
  const [description, setDescription] = useState(biosite.description || "");
  const [color, setColor] = useState(biosite.primary_color);
  const [published, setPublished] = useState(biosite.published);
  const [logoUrl, setLogoUrl] = useState(biosite.logo_url);
  const [coverUrl, setCoverUrl] = useState(biosite.cover_url);
  const [coverType, setCoverType] = useState(biosite.cover_type);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);

  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("logo");
    const url = await uploadMedia(file, biosite.owner_id, "logo");
    setLogoUrl(url);
    await supabase.from("biosites").update({ logo_url: url }).eq("id", biosite.id);
    setUploading(null);
    router.refresh();
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("cover");
    const type = file.type.startsWith("video") ? "video" : "image";
    const url = await uploadMedia(file, biosite.owner_id, "cover");
    setCoverUrl(url);
    setCoverType(type);
    await supabase.from("biosites").update({ cover_url: url, cover_type: type }).eq("id", biosite.id);
    setUploading(null);
    router.refresh();
  }

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("biosites")
      .update({
        business_name: name,
        description,
        primary_color: color,
        published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", biosite.id);
    setSaving(false);
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => logoInput.current?.click()}
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-full w-full object-cover" />
          ) : uploading === "logo" ? (
            "..."
          ) : (
            "Logo"
          )}
        </button>
        <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />

        <button
          onClick={() => coverInput.current?.click()}
          className="flex h-16 flex-1 items-center justify-center overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400"
        >
          {coverUrl ? (
            coverType === "video" ? (
              "Vídeo enviado"
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            )
          ) : uploading === "cover" ? (
            "..."
          ) : (
            "Capa (imagem ou vídeo)"
          )}
        </button>
        <input
          ref={coverInput}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleCoverChange}
        />
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do negócio"
        className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm outline-none"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descrição curta"
        className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm outline-none"
      />

      <div className="flex items-center gap-3">
        <label className="text-sm text-neutral-600">Cor principal</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-12 rounded border border-neutral-200"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-600">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        Publicado
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

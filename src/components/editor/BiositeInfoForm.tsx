"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadMedia } from "@/lib/upload";
import { getContrastTextColor } from "@/lib/color";
import type { Biosite } from "@/lib/types";

export function BiositeInfoForm({ biosite }: { biosite: Biosite }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(biosite.business_name);
  const [description, setDescription] = useState(biosite.description || "");
  const [color, setColor] = useState(biosite.primary_color);
  const [buttonTextColor, setButtonTextColor] = useState(biosite.button_text_color);
  const [logoShape, setLogoShape] = useState(biosite.logo_shape);
  const [logoTransparent, setLogoTransparent] = useState(biosite.logo_transparent);
  const [theme, setTheme] = useState(biosite.theme);
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
    try {
      const { url } = await uploadMedia(file, biosite.owner_id, "logo");
      setLogoUrl(url);
      await supabase.from("biosites").update({ logo_url: url }).eq("id", biosite.id);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar o arquivo.");
    } finally {
      setUploading(null);
    }
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("cover");
    const type = file.type.startsWith("video") ? "video" : "image";
    try {
      const { url } = await uploadMedia(file, biosite.owner_id, "cover");
      setCoverUrl(url);
      setCoverType(type);
      await supabase.from("biosites").update({ cover_url: url, cover_type: type }).eq("id", biosite.id);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar o arquivo.");
    } finally {
      setUploading(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("biosites")
      .update({
        business_name: name,
        description,
        primary_color: color,
        button_text_color: buttonTextColor || null,
        logo_shape: logoShape,
        logo_transparent: logoTransparent,
        theme,
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
          className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400 ${
            logoShape === "round" ? "rounded-full" : "rounded-lg"
          }`}
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

      <div className="flex items-center gap-2 text-sm">
        <span className="text-neutral-600">Formato da logo</span>
        <button
          onClick={() => setLogoShape("square")}
          className="rounded-full border px-3 py-1 text-xs"
          style={{
            borderColor: logoShape === "square" ? color : "#e5e5e5",
            backgroundColor: logoShape === "square" ? `${color}14` : "white",
          }}
        >
          Quadrada
        </button>
        <button
          onClick={() => setLogoShape("round")}
          className="rounded-full border px-3 py-1 text-xs"
          style={{
            borderColor: logoShape === "round" ? color : "#e5e5e5",
            backgroundColor: logoShape === "round" ? `${color}14` : "white",
          }}
        >
          Redonda
        </button>
        <label className="ml-2 flex items-center gap-1.5 text-xs text-neutral-500">
          <input
            type="checkbox"
            checked={logoTransparent}
            onChange={(e) => setLogoTransparent(e.target.checked)}
          />
          Logo sem fundo (PNG transparente)
        </label>
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

      <div className="flex items-center gap-2 text-sm">
        <span className="text-neutral-600">Tema</span>
        <button
          onClick={() => setTheme("light")}
          className="rounded-full border px-3 py-1 text-xs"
          style={{
            borderColor: theme === "light" ? color : "#e5e5e5",
            backgroundColor: theme === "light" ? `${color}14` : "white",
          }}
        >
          Claro
        </button>
        <button
          onClick={() => setTheme("dark")}
          className="rounded-full border px-3 py-1 text-xs"
          style={{
            borderColor: theme === "dark" ? color : "#e5e5e5",
            backgroundColor: theme === "dark" ? `${color}14` : "white",
          }}
        >
          Escuro
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-neutral-600">Cor principal</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-12 rounded border border-neutral-200"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-neutral-600">Cor do texto dos botões</label>
        <input
          type="color"
          value={buttonTextColor || getContrastTextColor(color)}
          onChange={(e) => setButtonTextColor(e.target.value)}
          className="h-8 w-12 rounded border border-neutral-200"
        />
        {buttonTextColor && (
          <button onClick={() => setButtonTextColor(null)} className="text-xs text-neutral-400 underline">
            usar automático
          </button>
        )}
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

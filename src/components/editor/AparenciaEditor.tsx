"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadMedia } from "@/lib/upload";
import { getContrastTextColor } from "@/lib/color";
import type { Biosite } from "@/lib/types";

const FONT_OPTIONS: { value: Biosite["font_family"]; label: string }[] = [
  { value: "default", label: "Padrão" },
  { value: "poppins", label: "Poppins — arredondada, amigável" },
  { value: "playfair", label: "Playfair Display — elegante, serifada" },
  { value: "bebas", label: "Bebas Neue — forte, impacto" },
  { value: "caveat", label: "Caveat — manuscrita, pessoal" },
  { value: "oswald", label: "Oswald — condensada, versátil" },
  { value: "merriweather", label: "Merriweather — serifada, legível" },
];

export function AparenciaEditor({ biosite }: { biosite: Biosite }) {
  const router = useRouter();
  const supabase = createClient();
  const [theme, setTheme] = useState(biosite.theme);
  const [color, setColor] = useState(biosite.primary_color);
  const [buttonTextColor, setButtonTextColor] = useState(biosite.button_text_color);
  const [logoSize, setLogoSize] = useState(biosite.logo_size);
  const [fontFamily, setFontFamily] = useState(biosite.font_family);
  const [backgroundDarken, setBackgroundDarken] = useState(biosite.background_darken);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(biosite.background_image_url);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const bgInput = useRef<HTMLInputElement>(null);

  // Snapshot of the persisted values, so the autosave effect can tell a real edit apart from
  // React Strict Mode's double effect invocation in development.
  const lastSaved = useRef({ theme, color, buttonTextColor, logoSize, fontFamily, backgroundDarken });

  useEffect(() => {
    const current = { theme, color, buttonTextColor, logoSize, fontFamily, backgroundDarken };
    if (JSON.stringify(current) === JSON.stringify(lastSaved.current)) return;

    setAutosaveStatus("saving");
    const timeout = setTimeout(async () => {
      await supabase
        .from("biosites")
        .update({
          theme,
          primary_color: color,
          button_text_color: buttonTextColor || null,
          logo_size: logoSize,
          font_family: fontFamily,
          background_darken: backgroundDarken,
          updated_at: new Date().toISOString(),
        })
        .eq("id", biosite.id);
      lastSaved.current = current;
      setAutosaveStatus("saved");
      router.refresh();
    }, 900);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, color, buttonTextColor, logoSize, fontFamily, backgroundDarken]);

  async function handleBackgroundChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    try {
      const { url } = await uploadMedia(file, biosite.owner_id, "background");
      setBackgroundImageUrl(url);
      await supabase.from("biosites").update({ background_image_url: url }).eq("id", biosite.id);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar o arquivo.");
    } finally {
      setUploadingBg(false);
    }
  }

  async function handleRemoveBackground() {
    setBackgroundImageUrl(null);
    await supabase.from("biosites").update({ background_image_url: null }).eq("id", biosite.id);
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-neutral-600">Tema</span>
        <button
          onClick={() => setTheme("light")}
          className={`rounded-full border px-3 py-1 text-xs ${
            theme === "light" ? "border-[#191970] bg-[#191970]/10" : "border-neutral-200"
          }`}
        >
          Claro
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`rounded-full border px-3 py-1 text-xs ${
            theme === "dark" ? "border-[#191970] bg-[#191970]/10" : "border-neutral-200"
          }`}
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

      <div className="flex items-center gap-2 text-sm">
        <span className="text-neutral-600">Tamanho da logo</span>
        {(["small", "medium", "large"] as const).map((size) => (
          <button
            key={size}
            onClick={() => setLogoSize(size)}
            className={`rounded-full border px-3 py-1 text-xs ${
              logoSize === size ? "border-[#191970] bg-[#191970]/10" : "border-neutral-200"
            }`}
          >
            {size === "small" ? "Pequena" : size === "medium" ? "Média" : "Grande"}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-neutral-600">Fonte do biosite</span>
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value as Biosite["font_family"])}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none"
        >
          {FONT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-neutral-600">Imagem de fundo</span>
        <p className="text-xs text-neutral-400">
          Recomendado: 1080×1920px (formato celular). Fica fixa e o conteúdo rola por cima.
        </p>
        <button
          onClick={() => bgInput.current?.click()}
          className="flex h-24 items-center justify-center overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400"
        >
          {backgroundImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={backgroundImageUrl} alt="" className="h-full w-full object-cover" />
          ) : uploadingBg ? (
            "Enviando..."
          ) : (
            "Enviar imagem de fundo"
          )}
        </button>
        <input
          ref={bgInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBackgroundChange}
        />
        {backgroundImageUrl && (
          <button onClick={handleRemoveBackground} className="self-start text-xs text-neutral-400 underline">
            remover imagem de fundo
          </button>
        )}
        <label className="flex items-center gap-2 text-xs text-neutral-500">
          <input
            type="checkbox"
            checked={backgroundDarken}
            onChange={(e) => setBackgroundDarken(e.target.checked)}
          />
          Escurecer levemente a imagem (ajuda a ler o texto por cima)
        </label>
      </div>

      {autosaveStatus !== "idle" && (
        <span className="text-xs text-neutral-400">
          {autosaveStatus === "saving" ? "Salvando automaticamente..." : "Salvo automaticamente ✓"}
        </span>
      )}
    </section>
  );
}

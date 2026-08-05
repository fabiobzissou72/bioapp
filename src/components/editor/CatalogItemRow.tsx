"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadMedia } from "@/lib/upload";
import type { CatalogItem } from "@/lib/types";

export function CatalogItemRow({
  item,
  ownerId,
  isFirst,
  isLast,
  onMove,
}: {
  item: CatalogItem;
  ownerId: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState(item.title || "");
  const [description, setDescription] = useState(item.description || "");
  const [ctaLabel, setCtaLabel] = useState(item.cta_label || "");
  const [ctaUrl, setCtaUrl] = useState(item.cta_url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function replaceMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const mediaType = file.type.startsWith("video") ? "video" : "image";
    const url = await uploadMedia(file, ownerId, "catalog");
    await supabase.from("catalog_items").update({ media_url: url, media_type: mediaType }).eq("id", item.id);
    setUploading(false);
    router.refresh();
  }

  async function save() {
    setSaving(true);
    await supabase
      .from("catalog_items")
      .update({ title, description, cta_label: ctaLabel || null, cta_url: ctaUrl || null })
      .eq("id", item.id);
    setSaving(false);
    router.refresh();
  }

  async function updateField(field: "aspect" | "object_fit" | "item_type", value: string) {
    await supabase.from("catalog_items").update({ [field]: value }).eq("id", item.id);
    router.refresh();
  }

  async function remove() {
    await supabase.from("catalog_items").delete().eq("id", item.id);
    router.refresh();
  }

  return (
    <div className="flex gap-3 rounded-lg border border-neutral-200 p-3">
      <button
        onClick={() => fileInput.current?.click()}
        className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400"
      >
        {uploading ? (
          "..."
        ) : item.media_url ? (
          item.media_type === "video" ? (
            <video src={item.media_url} className="h-full w-full object-cover" muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.media_url} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          "Mídia"
        )}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={replaceMedia}
      />

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={save}
            placeholder="Título"
            className="flex-1 rounded-lg border border-neutral-200 bg-white text-neutral-900 px-2 py-1 text-sm"
          />
          <button onClick={() => onMove(-1)} disabled={isFirst} className="text-neutral-400 disabled:opacity-20">
            ↑
          </button>
          <button onClick={() => onMove(1)} disabled={isLast} className="text-neutral-400 disabled:opacity-20">
            ↓
          </button>
          <button onClick={remove} className="text-red-500 text-sm">
            excluir
          </button>
        </div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={save}
          placeholder="Texto (opcional)"
          className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-2 py-1 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <input
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            onBlur={save}
            placeholder="Texto do botão (opcional)"
            className="flex-1 rounded-lg border border-neutral-200 bg-white text-neutral-900 px-2 py-1 text-sm"
          />
          <input
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            onBlur={save}
            placeholder="Link do botão (ex: WhatsApp)"
            className="flex-1 rounded-lg border border-neutral-200 bg-white text-neutral-900 px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <select
            defaultValue={item.item_type}
            onChange={(e) => updateField("item_type", e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-2 py-1"
          >
            <option value="product">Produto</option>
            <option value="service">Serviço</option>
          </select>
          <select
            defaultValue={item.aspect}
            onChange={(e) => updateField("aspect", e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-2 py-1"
          >
            <option value="square">Quadrada</option>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
            <option value="original">Original</option>
          </select>
          <select
            defaultValue={item.object_fit}
            onChange={(e) => updateField("object_fit", e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-2 py-1"
          >
            <option value="cover">Preencher (corta)</option>
            <option value="contain">Conter (não corta)</option>
          </select>
          {saving && <span className="self-center text-neutral-400">salvando...</span>}
        </div>
      </div>
    </div>
  );
}

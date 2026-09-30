"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadMedia } from "@/lib/upload";
import { CatalogItemRow } from "./CatalogItemRow";
import type { CatalogGroup, CatalogItem } from "@/lib/types";

export function CatalogGroupCard({
  group,
  items,
  ownerId,
  isFirst,
  isLast,
}: {
  group: CatalogGroup;
  items: CatalogItem[];
  ownerId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(true);
  const [name, setName] = useState(group.name);
  const [uploading, setUploading] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  async function saveName() {
    await supabase.from("catalog_groups").update({ name }).eq("id", group.id);
    router.refresh();
  }

  async function toggleEnabled() {
    await supabase.from("catalog_groups").update({ enabled: !group.enabled }).eq("id", group.id);
    router.refresh();
  }

  async function setLayout(layout: CatalogGroup["layout"]) {
    await supabase.from("catalog_groups").update({ layout }).eq("id", group.id);
    router.refresh();
  }

  async function setInterval(seconds: number) {
    await supabase.from("catalog_groups").update({ interval_seconds: seconds }).eq("id", group.id);
    router.refresh();
  }

  async function moveGroup(direction: -1 | 1) {
    await supabase.from("catalog_groups").update({ position: group.position + direction }).eq("id", group.id);
    router.refresh();
  }

  async function removeGroup() {
    await supabase.from("catalog_groups").delete().eq("id", group.id);
    router.refresh();
  }

  async function addItem(file: File) {
    setUploading(true);
    const mediaType = file.type.startsWith("video") ? "video" : "image";
    try {
      const { url, posterUrl } = await uploadMedia(file, ownerId, "catalog");
      await supabase.from("catalog_items").insert({
        group_id: group.id,
        media_type: mediaType,
        media_url: url,
        poster_url: posterUrl,
        position: items.length,
      });
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar o arquivo.");
    } finally {
      setUploading(false);
    }
  }

  async function moveItem(item: CatalogItem, direction: -1 | 1) {
    const index = items.findIndex((i) => i.id === item.id);
    const target = items[index + direction];
    if (!target) return;
    await Promise.all([
      supabase.from("catalog_items").update({ position: target.position }).eq("id", item.id),
      supabase.from("catalog_items").update({ position: item.position }).eq("id", target.id),
    ]);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-neutral-200">
      <div className="flex items-center gap-2 p-3">
        <button onClick={() => setOpen((o) => !o)} className="text-neutral-400">
          {open ? "▾" : "▸"}
        </button>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          className="flex-1 rounded-lg border border-neutral-200 bg-white text-neutral-900 px-2 py-1 text-sm font-medium"
        />
        <span className="text-xs text-neutral-400">{items.length} item(ns)</span>
        <label className="flex items-center gap-1 text-xs text-neutral-500">
          <input type="checkbox" checked={group.enabled} onChange={toggleEnabled} />
          ativo
        </label>
        <button onClick={() => moveGroup(-1)} disabled={isFirst} className="text-neutral-400 disabled:opacity-20">
          ↑
        </button>
        <button onClick={() => moveGroup(1)} disabled={isLast} className="text-neutral-400 disabled:opacity-20">
          ↓
        </button>
        <button onClick={removeGroup} className="text-sm text-red-500">
          excluir
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t border-neutral-200 p-3">
          <div className="flex flex-col gap-2 rounded-lg bg-neutral-50 p-3">
            <span className="text-sm font-medium text-neutral-700">Como exibir</span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "stacked", label: "Empilhado" },
                  { value: "carousel", label: "Carrossel" },
                  { value: "grid", label: "Grade (miniaturas)" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLayout(option.value)}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium"
                  style={
                    group.layout === option.value
                      ? { borderColor: "#db2777", backgroundColor: "#fdf2f8", color: "#db2777" }
                      : { borderColor: "#e5e5e5", color: "#525252" }
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
            {group.layout === "carousel" && (
              <label className="flex items-center gap-2 text-xs text-neutral-500">
                Tempo entre itens: {group.interval_seconds}s
                <input
                  type="range"
                  min={2}
                  max={15}
                  defaultValue={group.interval_seconds}
                  onMouseUp={(e) => setInterval(Number(e.currentTarget.value))}
                  onTouchEnd={(e) => setInterval(Number(e.currentTarget.value))}
                  className="flex-1"
                />
              </label>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <CatalogItemRow
                key={item.id}
                item={item}
                ownerId={ownerId}
                isFirst={i === 0}
                isLast={i === items.length - 1}
                onMove={(direction) => moveItem(item, direction)}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => imageInput.current?.click()}
              disabled={uploading}
              className="flex-1 rounded-full border border-neutral-200 py-2 text-sm font-medium text-neutral-600 hover:border-[#191970]/40 hover:text-[#191970]"
            >
              {uploading ? "Enviando..." : "🖼 Imagem"}
            </button>
            <button
              onClick={() => videoInput.current?.click()}
              disabled={uploading}
              className="flex-1 rounded-full border border-neutral-200 py-2 text-sm font-medium text-neutral-600 hover:border-[#191970]/40 hover:text-[#191970]"
            >
              {uploading ? "Enviando..." : "🎥 Vídeo"}
            </button>
            <input
              ref={imageInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && addItem(e.target.files[0])}
            />
            <input
              ref={videoInput}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && addItem(e.target.files[0])}
            />
          </div>
        </div>
      )}
    </div>
  );
}

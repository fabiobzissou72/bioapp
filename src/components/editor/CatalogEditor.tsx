"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CatalogGroupCard } from "./CatalogGroupCard";
import type { CatalogGroup, CatalogItem } from "@/lib/types";

export function CatalogEditor({
  biositeId,
  ownerId,
  groups,
  itemsByGroup,
}: {
  biositeId: string;
  ownerId: string;
  groups: CatalogGroup[];
  itemsByGroup: Record<string, CatalogItem[]>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function createGroup() {
    if (!newName) return;
    setSaving(true);
    await supabase.from("catalog_groups").insert({
      biosite_id: biositeId,
      name: newName,
      position: groups.length,
    });
    setSaving(false);
    setAdding(false);
    setNewName("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, i) => (
        <CatalogGroupCard
          key={group.id}
          group={group}
          items={itemsByGroup[group.id] || []}
          ownerId={ownerId}
          isFirst={i === 0}
          isLast={i === groups.length - 1}
        />
      ))}

      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="rounded-xl border-2 border-dashed border-neutral-200 py-3 text-sm font-medium text-neutral-500 hover:border-[#191970]/40 hover:text-[#191970]"
        >
          + Novo catálogo
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3">
          <p className="text-xs text-neutral-500">
            Dê um nome para o catálogo (ex: Fotos da loja, Vídeos, Promoções).
          </p>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do catálogo"
            autoFocus
            className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={createGroup}
              disabled={saving || !newName}
              className="rounded-full bg-[#191970] px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Criar
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewName("");
              }}
              className="rounded-full px-5 py-2 text-sm font-medium text-neutral-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

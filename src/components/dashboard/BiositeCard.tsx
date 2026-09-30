"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Biosite } from "@/lib/types";

export function BiositeCard({ biosite }: { biosite: Biosite }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function togglePublished() {
    setBusy(true);
    await supabase.from("biosites").update({ published: !biosite.published }).eq("id", biosite.id);
    setBusy(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Excluir "${biosite.business_name}"? Essa ação não pode ser desfeita.`)) return;
    setBusy(true);
    await supabase.from("biosites").delete().eq("id", biosite.id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition hover:border-[#191970]/40">
      <Link href={`/painel/${biosite.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: biosite.primary_color }}
        >
          {biosite.business_name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-neutral-900">{biosite.business_name}</p>
          <p className="truncate text-sm text-neutral-500">/{biosite.slug}</p>
        </div>
      </Link>

      <span
        className="shrink-0 rounded-full px-2 py-1 text-xs font-medium"
        style={{
          backgroundColor: biosite.published ? "#dcfce7" : "#f3f4f6",
          color: biosite.published ? "#166534" : "#6b7280",
        }}
      >
        {biosite.published ? "publicado" : "pausado"}
      </span>

      <button
        onClick={togglePublished}
        disabled={busy}
        className="shrink-0 text-xs font-medium text-neutral-500 hover:text-neutral-800 disabled:opacity-40"
      >
        {biosite.published ? "pausar" : "reativar"}
      </button>

      <button
        onClick={handleDelete}
        disabled={busy}
        className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-40"
      >
        excluir
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Service } from "@/lib/types";

export function ServicesEditor({ biositeId, services }: { biositeId: string; services: Service[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  async function addService() {
    if (!name) return;
    setSaving(true);
    await supabase.from("services").insert({
      biosite_id: biositeId,
      name,
      duration_minutes: parseInt(duration) || 60,
      price: price ? parseFloat(price.replace(",", ".")) : null,
    });
    setSaving(false);
    setName("");
    setDuration("60");
    setPrice("");
    router.refresh();
  }

  async function removeService(id: string) {
    await supabase.from("services").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {services.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        >
          <span className="flex-1">
            {s.name} · {s.duration_minutes} min{s.price ? ` · R$ ${s.price.toFixed(2)}` : ""}
          </span>
          <button onClick={() => removeService(s.id)} className="text-red-500">
            excluir
          </button>
        </div>
      ))}

      <div className="mt-1 flex flex-wrap gap-2 rounded-lg border border-neutral-200 p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do serviço"
          className="min-w-40 flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Minutos"
          className="w-24 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Preço R$"
          className="w-28 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
        <button
          onClick={addService}
          disabled={saving || !name}
          className="rounded-full bg-pink-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

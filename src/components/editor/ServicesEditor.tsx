"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Service } from "@/lib/types";

function ServiceRow({ service }: { service: Service }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(service.name);
  const [duration, setDuration] = useState(String(service.duration_minutes));
  const [price, setPrice] = useState(service.price != null ? String(service.price) : "");

  async function save() {
    await supabase
      .from("services")
      .update({
        name,
        duration_minutes: parseInt(duration) || service.duration_minutes,
        price: price ? parseFloat(price.replace(",", ".")) : null,
      })
      .eq("id", service.id);
    router.refresh();
  }

  async function remove() {
    await supabase.from("services").delete().eq("id", service.id);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={save}
        className="min-w-32 flex-1 rounded-lg border border-neutral-200 bg-white px-2 py-1"
      />
      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        onBlur={save}
        placeholder="min"
        className="w-20 rounded-lg border border-neutral-200 bg-white px-2 py-1"
      />
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        onBlur={save}
        placeholder="R$"
        className="w-24 rounded-lg border border-neutral-200 bg-white px-2 py-1"
      />
      <button onClick={remove} className="text-red-500">
        excluir
      </button>
    </div>
  );
}

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

  return (
    <div className="flex flex-col gap-2">
      {services.map((s) => (
        <ServiceRow key={s.id} service={s} />
      ))}

      <div className="mt-1 flex flex-wrap gap-2 rounded-lg border border-neutral-200 p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do serviço"
          className="min-w-40 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Minutos"
          className="w-24 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Preço R$"
          className="w-28 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
        />
        <button
          onClick={addService}
          disabled={saving || !name}
          className="rounded-full bg-[#191970] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

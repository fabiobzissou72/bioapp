"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Biosite, HighlightCard } from "@/lib/types";

export function HighlightCardsEditor({ biosite }: { biosite: Biosite }) {
  const router = useRouter();
  const supabase = createClient();
  const [cards, setCards] = useState<HighlightCard[]>(biosite.highlight_cards);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const lastSaved = useRef(cards);

  useEffect(() => {
    if (JSON.stringify(cards) === JSON.stringify(lastSaved.current)) return;

    setAutosaveStatus("saving");
    const timeout = setTimeout(async () => {
      await supabase
        .from("biosites")
        .update({ highlight_cards: cards, updated_at: new Date().toISOString() })
        .eq("id", biosite.id);
      lastSaved.current = cards;
      setAutosaveStatus("saved");
      router.refresh();
    }, 900);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  function addCard() {
    setCards((prev) => [...prev, { title: "", subtitle: "" }]);
  }

  function updateCard(index: number, patch: Partial<HighlightCard>) {
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function removeCard(index: number) {
    setCards((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">Cards de destaque</h3>
      <p className="text-xs text-neutral-500">
        Pequenos cards de destaque exibidos no biosite (ex: &quot;Entrega em 30min&quot;, &quot;Parcelamos em 3x&quot;).
      </p>

      {cards.map((card, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            value={card.title}
            onChange={(e) => updateCard(index, { title: e.target.value })}
            placeholder="Título"
            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none"
          />
          <input
            value={card.subtitle}
            onChange={(e) => updateCard(index, { subtitle: e.target.value })}
            placeholder="Subtítulo (opcional)"
            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none"
          />
          <button onClick={() => removeCard(index)} className="text-xs text-red-500 hover:text-red-700">
            excluir
          </button>
        </div>
      ))}

      <button
        onClick={addCard}
        className="self-start rounded-full border-2 border-dashed border-neutral-200 px-4 py-1.5 text-xs font-medium text-neutral-500 hover:border-[#191970]/40 hover:text-[#191970]"
      >
        + Adicionar card
      </button>

      {autosaveStatus !== "idle" && (
        <span className="text-xs text-neutral-400">
          {autosaveStatus === "saving" ? "Salvando automaticamente..." : "Salvo automaticamente ✓"}
        </span>
      )}
    </section>
  );
}

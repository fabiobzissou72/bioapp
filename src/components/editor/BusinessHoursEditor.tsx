"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Biosite, BusinessHourEntry } from "@/lib/types";

const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function BusinessHoursEditor({ biosite }: { biosite: Biosite }) {
  const router = useRouter();
  const supabase = createClient();
  const [enabled, setEnabled] = useState(biosite.show_business_hours);
  const [hours, setHours] = useState<BusinessHourEntry[]>(biosite.business_hours);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const lastSaved = useRef({ enabled, hours });

  useEffect(() => {
    const current = { enabled, hours };
    if (JSON.stringify(current) === JSON.stringify(lastSaved.current)) return;

    setAutosaveStatus("saving");
    const timeout = setTimeout(async () => {
      await supabase
        .from("biosites")
        .update({
          show_business_hours: enabled,
          business_hours: hours,
          updated_at: new Date().toISOString(),
        })
        .eq("id", biosite.id);
      lastSaved.current = current;
      setAutosaveStatus("saved");
      router.refresh();
    }, 900);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, hours]);

  function updateDay(day: number, patch: Partial<BusinessHourEntry>) {
    setHours((prev) => prev.map((h) => (h.day === day ? { ...h, ...patch } : h)));
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">🕒 Horário de funcionamento</h3>
      <p className="text-xs text-neutral-500">
        Define quando o negócio atende — mostra um selo &quot;Aberto&quot;/&quot;Fechado&quot; no biosite público.
      </p>
      <label className="flex items-center gap-2 text-sm text-neutral-600">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Ativar horário de funcionamento
      </label>

      {enabled && (
        <div className="flex flex-col gap-2">
          {hours
            .slice()
            .sort((a, b) => a.day - b.day)
            .map((entry) => (
              <div key={entry.day} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="w-20 shrink-0 text-neutral-700">{DAY_LABELS[entry.day]}</span>
                <label className="flex items-center gap-1 text-xs text-neutral-500">
                  <input
                    type="checkbox"
                    checked={entry.closed}
                    onChange={(e) => updateDay(entry.day, { closed: e.target.checked })}
                  />
                  Fechado
                </label>
                {!entry.closed && (
                  <>
                    <input
                      type="time"
                      value={entry.open}
                      onChange={(e) => updateDay(entry.day, { open: e.target.value })}
                      className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
                    />
                    <span className="text-neutral-400">às</span>
                    <input
                      type="time"
                      value={entry.close}
                      onChange={(e) => updateDay(entry.day, { close: e.target.value })}
                      className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
                    />
                  </>
                )}
              </div>
            ))}
        </div>
      )}

      {autosaveStatus !== "idle" && (
        <span className="text-xs text-neutral-400">
          {autosaveStatus === "saving" ? "Salvando automaticamente..." : "Salvo automaticamente ✓"}
        </span>
      )}
    </section>
  );
}

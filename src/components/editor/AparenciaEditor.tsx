"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getContrastTextColor } from "@/lib/color";
import type { Biosite } from "@/lib/types";

export function AparenciaEditor({ biosite }: { biosite: Biosite }) {
  const router = useRouter();
  const supabase = createClient();
  const [theme, setTheme] = useState(biosite.theme);
  const [color, setColor] = useState(biosite.primary_color);
  const [buttonTextColor, setButtonTextColor] = useState(biosite.button_text_color);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Snapshot of the persisted values, so the autosave effect can tell a real edit apart from
  // React Strict Mode's double effect invocation in development.
  const lastSaved = useRef({ theme, color, buttonTextColor });

  useEffect(() => {
    const current = { theme, color, buttonTextColor };
    if (JSON.stringify(current) === JSON.stringify(lastSaved.current)) return;

    setAutosaveStatus("saving");
    const timeout = setTimeout(async () => {
      await supabase
        .from("biosites")
        .update({
          theme,
          primary_color: color,
          button_text_color: buttonTextColor || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", biosite.id);
      lastSaved.current = current;
      setAutosaveStatus("saved");
      router.refresh();
    }, 900);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, color, buttonTextColor]);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4">
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

      {autosaveStatus !== "idle" && (
        <span className="text-xs text-neutral-400">
          {autosaveStatus === "saving" ? "Salvando automaticamente..." : "Salvo automaticamente ✓"}
        </span>
      )}
    </section>
  );
}

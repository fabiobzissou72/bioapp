"use client";

import { useEffect, useState } from "react";

export function LivePreviewPanel({ url }: { url: string }) {
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // The editor autosaves ~1s after a change, so polling the preview every few
    // seconds is enough to feel like watching the biosite build live.
    const interval = setInterval(() => setReloadKey((k) => k + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="sticky top-6 hidden w-[380px] shrink-0 lg:block">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-900">Preview ao vivo</span>
          <div className="flex overflow-hidden rounded-full border border-neutral-200 text-xs font-medium">
            <button
              onClick={() => setMode("mobile")}
              className={`px-3 py-1 transition ${
                mode === "mobile" ? "bg-teal-600 text-white" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              Mobile
            </button>
            <button
              onClick={() => setMode("desktop")}
              className={`px-3 py-1 transition ${
                mode === "desktop" ? "bg-teal-600 text-white" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              Desktop
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          <div
            className={`rounded-[2rem] border-[8px] border-neutral-900 bg-neutral-900 shadow-xl transition-all ${
              mode === "mobile" ? "w-[260px]" : "w-full"
            }`}
          >
            <iframe
              key={reloadKey}
              src={url}
              title="Preview ao vivo do biosite"
              className={`rounded-[1.25rem] bg-white ${mode === "mobile" ? "h-[540px] w-full" : "h-[420px] w-full"}`}
            />
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-neutral-400">Atualiza sozinho a cada poucos segundos</p>
      </div>
    </aside>
  );
}

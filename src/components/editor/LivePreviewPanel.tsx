"use client";

import { useState } from "react";

export function LivePreviewPanel({ url }: { url: string }) {
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <aside className="sticky top-6 hidden w-[380px] shrink-0 lg:block">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-900">Preview ao vivo</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              title="Atualizar preview"
              className="rounded-full border border-neutral-200 px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
            >
              ↻
            </button>
            <div className="flex overflow-hidden rounded-full border border-neutral-200 text-xs font-medium">
              <button
                onClick={() => setMode("mobile")}
                className={`px-2.5 py-1 transition ${
                  mode === "mobile" ? "bg-[#191970] text-white" : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                Mobile
              </button>
              <button
                onClick={() => setMode("desktop")}
                className={`px-2.5 py-1 transition ${
                  mode === "desktop" ? "bg-[#191970] text-white" : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                Desktop
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div
            className={`rounded-[2rem] border-[6px] border-neutral-900 bg-neutral-900 shadow-xl transition-all ${
              mode === "mobile" ? "w-[240px]" : "w-full"
            }`}
          >
            {mode === "mobile" && <div className="mx-auto mb-1 h-4 w-20 rounded-b-lg bg-neutral-900" />}
            <iframe
              key={reloadKey}
              src={url}
              title="Preview do biosite"
              className={`rounded-[1.25rem] bg-white ${mode === "mobile" ? "h-[500px] w-full" : "h-[400px] w-full"}`}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

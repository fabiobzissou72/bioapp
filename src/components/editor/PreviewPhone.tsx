"use client";

import { useEffect, useRef, useState } from "react";

export function PreviewPhone({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeSrc = useRef(url);

  useEffect(() => {
    if (!open) return;
    // Polls for edits: the editor autosaves ~1s after a change, so refreshing the
    // preview every few seconds is enough to feel like watching it build live.
    const interval = setInterval(() => setReloadKey((k) => k + 1), 3000);
    return () => clearInterval(interval);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-2xl text-white shadow-lg transition hover:bg-teal-700"
        aria-label="Ver preview do biosite"
      >
        👁️
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex max-h-[90vh] flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 text-sm font-medium text-white"
            >
              Fechar ✕
            </button>
            <div className="rounded-[2.5rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl">
              <div className="mx-auto mb-1 h-5 w-28 rounded-b-xl bg-neutral-900" />
              <iframe
                key={reloadKey}
                src={iframeSrc.current}
                title="Preview do biosite"
                className="h-[640px] w-[320px] rounded-[1.75rem] bg-white"
              />
            </div>
            <p className="mt-3 text-xs text-white/70">Atualiza sozinho a cada poucos segundos</p>
          </div>
        </div>
      )}
    </>
  );
}

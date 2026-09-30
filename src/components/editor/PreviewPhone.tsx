"use client";

import { useRef, useState } from "react";

export function PreviewPhone({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeSrc = useRef(url);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#191970] text-xl text-white shadow-lg transition hover:bg-[#12124f]"
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
            <div className="mb-2 flex items-center gap-3">
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
              >
                ↻ Atualizar
              </button>
              <button onClick={() => setOpen(false)} className="text-sm font-medium text-white">
                Fechar ✕
              </button>
            </div>
            <div className="rounded-[2.5rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl">
              <div className="mx-auto mb-1 h-5 w-28 rounded-b-xl bg-neutral-900" />
              <iframe
                key={reloadKey}
                src={iframeSrc.current}
                title="Preview do biosite"
                className="h-[640px] w-[320px] rounded-[1.75rem] bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

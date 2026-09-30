"use client";

import { useState } from "react";
import QRCode from "qrcode";

export function LivePreviewPanel({ url }: { url: string }) {
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");
  const [reloadKey, setReloadKey] = useState(0);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  async function handleQrCode() {
    setQrOpen(true);
    if (!qrDataUrl) {
      const dataUrl = await QRCode.toDataURL(url, { width: 220, margin: 1 });
      setQrDataUrl(dataUrl);
    }
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

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
            className={`relative rounded-[2rem] border-[6px] border-neutral-900 bg-neutral-900 shadow-xl transition-all ${
              mode === "mobile" ? "w-[240px]" : "w-full"
            }`}
          >
            {mode === "mobile" && <div className="mx-auto mb-1 h-4 w-20 rounded-b-lg bg-neutral-900" />}

            {mode === "mobile" && (
              <div className="absolute left-2 right-2 top-6 z-10 flex justify-between gap-2">
                <button
                  onClick={handleQrCode}
                  className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur hover:bg-black/80"
                >
                  ⊞ QR Code
                </button>
                <button
                  onClick={handleShare}
                  className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur hover:bg-black/80"
                >
                  {shared ? "Copiado!" : "⇗ Compartilhar"}
                </button>
              </div>
            )}

            <iframe
              key={reloadKey}
              src={url}
              title="Preview do biosite"
              className={`rounded-[1.25rem] bg-white ${mode === "mobile" ? "h-[500px] w-full" : "h-[400px] w-full"}`}
            />
          </div>
        </div>
      </div>

      {qrOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-neutral-900">QR Code do biosite</h3>
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR Code" className="h-56 w-56" />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center text-sm text-neutral-400">
                Gerando...
              </div>
            )}
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download="qrcode.png"
                className="w-full rounded-full bg-[#191970] py-2 text-center text-sm font-medium text-white"
              >
                Baixar
              </a>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

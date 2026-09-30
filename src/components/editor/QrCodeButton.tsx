"use client";

import { useState } from "react";
import QRCode from "qrcode";

export function QrCodeButton({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  async function handleOpen() {
    setOpen(true);
    if (!dataUrl) {
      const generated = await QRCode.toDataURL(url, { width: 280, margin: 1 });
      setDataUrl(generated);
    }
  }

  return (
    <>
      <button onClick={handleOpen} className="text-sm font-medium text-neutral-600">
        QR Code
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-neutral-900">QR Code do biosite</h3>
            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrl} alt="QR Code" className="h-56 w-56" />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center text-sm text-neutral-400">
                Gerando...
              </div>
            )}
            {dataUrl && (
              <a
                href={dataUrl}
                download="qrcode.png"
                className="w-full rounded-full bg-[#191970] py-2 text-center text-sm font-medium text-white"
              >
                Baixar
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}

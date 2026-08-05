"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { BiositeButton } from "@/lib/types";

// Escapes characters the WIFI: QR format treats as separators.
function escapeWifiField(value: string) {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function WifiButton({ button, style }: { button: BiositeButton; style: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const ssid = button.config.wifi_ssid;
  const password = button.config.wifi_password;

  useEffect(() => {
    if (!open || !ssid) return;
    const payload = `WIFI:T:${password ? "WPA" : "nopass"};S:${escapeWifiField(ssid)};${
      password ? `P:${escapeWifiField(password)};` : ""
    };`;
    QRCode.toDataURL(payload, { width: 220, margin: 1 }).then(setQrDataUrl);
  }, [open, ssid, password]);

  async function copyPassword() {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={style}
        className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-medium shadow transition active:scale-[0.98]"
      >
        📶 {button.label || "WiFi"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Wi-Fi</h3>
              <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                ✕
              </button>
            </div>
            <div className="flex flex-col items-center gap-3 text-sm">
              {qrDataUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR Code do Wi-Fi" className="h-48 w-48" />
                  <p className="text-center text-xs text-neutral-400">
                    Aponte a câmera do celular pra conectar direto
                  </p>
                </>
              )}
              <div className="w-full">
                <span className="text-neutral-500">Rede</span>
                <p className="font-medium text-neutral-900">{ssid || "—"}</p>
              </div>
              <div className="w-full">
                <span className="text-neutral-500">Senha</span>
                <p className="font-medium text-neutral-900">{password || "—"}</p>
              </div>
              <button
                onClick={copyPassword}
                className="mt-2 w-full rounded-full border border-neutral-200 px-5 py-3 font-medium text-neutral-700 hover:bg-neutral-50"
              >
                {copied ? "Senha copiada!" : "Copiar senha"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

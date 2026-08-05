"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { buildPixPayload } from "@/lib/pix";
import type { BiositeButton } from "@/lib/types";

export function PixButton({
  button,
  merchantName,
  style,
}: {
  button: BiositeButton;
  merchantName: string;
  style: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [amount, setAmount] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiaECola, setCopiaECola] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    const value = parseFloat(amount.replace(",", "."));
    if (!button.config.pix_key || !value || value <= 0) return;

    const payload = buildPixPayload({
      pixKey: button.config.pix_key,
      amount: value,
      merchantName,
      merchantCity: button.config.pix_merchant_city || "BRASIL",
    });

    const dataUrl = await QRCode.toDataURL(payload, { width: 240, margin: 1 });
    setQrDataUrl(dataUrl);
    setCopiaECola(payload);
  }

  async function handleCopy() {
    if (!copiaECola) return;
    await navigator.clipboard.writeText(copiaECola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setOpen(false);
    setPayerName("");
    setAmount("");
    setQrDataUrl(null);
    setCopiaECola(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={style}
        className="w-full rounded-full px-5 py-3 font-medium text-white shadow transition active:scale-[0.98]"
      >
        {button.label || "Pagar com Pix"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={reset}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Pagar com Pix</h3>
              <button onClick={reset} className="text-neutral-400 hover:text-neutral-700">
                ✕
              </button>
            </div>

            {!qrDataUrl ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-neutral-500">
                  Preencha os dados — o Pix cai direto pra {merchantName}.
                </p>
                <label className="text-sm font-medium text-neutral-700">
                  Seu nome
                  <input
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
                  />
                </label>
                <label className="text-sm font-medium text-neutral-700">
                  Valor (R$)
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="50,00"
                    inputMode="decimal"
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
                  />
                </label>
                <button
                  onClick={handleGenerate}
                  disabled={!amount}
                  style={style}
                  className="mt-2 w-full rounded-full px-5 py-3 font-medium text-white shadow disabled:opacity-40"
                >
                  Gerar Pix
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR Code Pix" className="h-56 w-56" />
                <p className="text-center text-sm text-neutral-500">
                  {payerName ? `Pix gerado para ${payerName}` : "Escaneie ou copie o código abaixo"}
                </p>
                <button
                  onClick={handleCopy}
                  className="w-full rounded-full border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {copied ? "Código copiado!" : "Copiar código Pix"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

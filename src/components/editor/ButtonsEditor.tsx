"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { geocodeAddress } from "@/lib/geocode";
import type { BiositeButton, ButtonConfig, ButtonType } from "@/lib/types";

const TYPE_LABELS: Record<ButtonType, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  google_review: "Avaliação Google",
  pix: "Pix",
  wifi: "Wi-Fi",
  address: "Endereço",
  booking: "Agendamento",
  custom: "Link personalizado",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  x_twitter: "X / Twitter",
  linkedin: "LinkedIn",
  threads: "Threads",
  telegram: "Telegram",
  pinterest: "Pinterest",
  snapchat: "Snapchat",
  twitch: "Twitch",
  spotify: "Spotify",
  site: "Site",
  phone: "Ligar",
  email: "E-mail",
  quote: "Pedir orçamento",
};

// Types that just need a URL (no special config), rendered with a generic URL input.
const SIMPLE_URL_TYPES: ButtonType[] = [
  "instagram",
  "google_review",
  "custom",
  "facebook",
  "tiktok",
  "youtube",
  "x_twitter",
  "linkedin",
  "threads",
  "telegram",
  "pinterest",
  "snapchat",
  "twitch",
  "spotify",
  "site",
];

function emptyDraft(): Partial<BiositeButton> {
  return { type: "custom", label: "", url: "", color: "", style: "full", pulse: false, config: {} };
}

export function ButtonsEditor({
  biositeId,
  buttons,
  slug,
}: {
  biositeId: string;
  buttons: BiositeButton[];
  slug: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<BiositeButton>>(emptyDraft());
  const [saving, setSaving] = useState(false);

  function startEdit(button: BiositeButton) {
    setDraft({ ...button, config: { ...button.config } });
    setEditingId(button.id);
    setAdding(true);
  }

  function resetForm() {
    setAdding(false);
    setEditingId(null);
    setDraft(emptyDraft());
  }

  async function saveButton() {
    setSaving(true);
    let config = draft.config || {};
    if (draft.type === "address" && config.full_address) {
      const coords = await geocodeAddress(config.full_address);
      if (coords) config = { ...config, address_lat: coords.lat, address_lng: coords.lng };
    }
    const payload = {
      type: draft.type,
      label: draft.label || null,
      url: draft.url || null,
      color: draft.color || null,
      style: draft.style,
      pulse: draft.pulse,
      config,
    };
    if (editingId) {
      await supabase.from("buttons").update(payload).eq("id", editingId);
    } else {
      await supabase.from("buttons").insert({ ...payload, biosite_id: biositeId, position: buttons.length });
    }
    setSaving(false);
    resetForm();
    router.refresh();
  }

  async function removeButton(id: string) {
    await supabase.from("buttons").delete().eq("id", id);
    router.refresh();
  }

  async function move(id: string, direction: -1 | 1) {
    const index = buttons.findIndex((b) => b.id === id);
    const target = buttons[index + direction];
    if (!target) return;
    const current = buttons[index];
    await Promise.all([
      supabase.from("buttons").update({ position: target.position }).eq("id", current.id),
      supabase.from("buttons").update({ position: current.position }).eq("id", target.id),
    ]);
    router.refresh();
  }

  function updateConfig(patch: Record<string, string>) {
    setDraft((d) => ({ ...d, config: { ...d.config, ...patch } }));
  }

  return (
    <div className="flex flex-col gap-2">
      {buttons.map((b, i) => (
        <div
          key={b.id}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
        >
          <span className="flex-1">
            <span className="font-medium">{b.label || TYPE_LABELS[b.type]}</span>
            {b.label && b.label !== TYPE_LABELS[b.type] ? (
              <span className="text-neutral-400"> · {TYPE_LABELS[b.type]}</span>
            ) : (
              ""
            )}
          </span>
          <button onClick={() => move(b.id, -1)} disabled={i === 0} className="text-neutral-400 disabled:opacity-20">
            ↑
          </button>
          <button
            onClick={() => move(b.id, 1)}
            disabled={i === buttons.length - 1}
            className="text-neutral-400 disabled:opacity-20"
          >
            ↓
          </button>
          <button onClick={() => startEdit(b)} className="text-neutral-600">
            editar
          </button>
          <button onClick={() => removeButton(b.id)} className="text-red-500">
            excluir
          </button>
        </div>
      ))}

      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="mt-1 rounded-xl border-2 border-dashed border-neutral-200 py-3 text-sm font-medium text-neutral-500 hover:border-[#191970]/40 hover:text-[#191970]"
        >
          + Adicionar botão
        </button>
      ) : (
        <div className="mt-1 flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white text-neutral-900 p-3">
          <select
            value={draft.type}
            onChange={(e) => {
              const nextType = e.target.value as ButtonType;
              setDraft((d) => ({
                ...d,
                type: nextType,
                config: nextType === "pix" ? { pix_key_type: "cpf" } : {},
              }));
            }}
            className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <input
            value={draft.label || ""}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            placeholder="Rótulo (opcional)"
            className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
          />

          {draft.type && SIMPLE_URL_TYPES.includes(draft.type) && (
            <input
              value={draft.url || ""}
              onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
              placeholder="URL"
              className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
            />
          )}

          {draft.type === "phone" && (
            <input
              value={draft.url || ""}
              onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
              placeholder="Telefone (com DDD, ex: 11999999999)"
              className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
            />
          )}

          {draft.type === "email" && (
            <input
              value={draft.url || ""}
              onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
              placeholder="E-mail"
              className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
            />
          )}

          {draft.type === "quote" && (
            <>
              <input
                value={draft.url || ""}
                onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
                placeholder="Telefone do WhatsApp (com DDD e país, ex: 5511999999999)"
                className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
              />
              <input
                value={draft.config?.message || ""}
                onChange={(e) => updateConfig({ message: e.target.value })}
                placeholder="Mensagem inicial (ex: Olá, gostaria de um orçamento)"
                className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
              />
            </>
          )}

          {draft.type === "whatsapp" && (
            <>
              <input
                value={draft.url || ""}
                onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
                placeholder="Telefone (com DDD e país, ex: 5511999999999)"
                className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
              />
              <input
                value={draft.config?.message || ""}
                onChange={(e) => updateConfig({ message: e.target.value })}
                placeholder="Mensagem inicial (opcional)"
                className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
              />
            </>
          )}

          {draft.type === "pix" && (
            <>
              <select
                value={draft.config?.pix_key_type || "cpf"}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    config: { ...d.config, pix_key_type: e.target.value as ButtonConfig["pix_key_type"] },
                  }))
                }
                className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="phone">Telefone</option>
                <option value="random">Chave aleatória</option>
              </select>
              <input
                value={draft.config?.pix_key || ""}
                onChange={(e) => updateConfig({ pix_key: e.target.value })}
                placeholder={
                  draft.config?.pix_key_type === "phone" ? "Telefone com DDD, ex: 11999999999" : "Chave Pix"
                }
                className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
              />
              <input
                value={draft.config?.pix_merchant_city || ""}
                onChange={(e) => updateConfig({ pix_merchant_city: e.target.value })}
                placeholder="Cidade do recebedor"
                className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
              />
            </>
          )}

          {draft.type === "wifi" && (
            <>
              <input
                value={draft.config?.wifi_ssid || ""}
                onChange={(e) => updateConfig({ wifi_ssid: e.target.value })}
                placeholder="Nome da rede"
                className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
              />
              <input
                value={draft.config?.wifi_password || ""}
                onChange={(e) => updateConfig({ wifi_password: e.target.value })}
                placeholder="Senha"
                className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
              />
            </>
          )}

          {draft.type === "address" && (
            <>
              <textarea
                value={draft.config?.full_address || ""}
                onChange={(e) => updateConfig({ full_address: e.target.value })}
                placeholder="Endereço completo (rua, número, cidade, estado)"
                className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-4 text-sm text-neutral-600">
                Cor de fundo do bloco
                <input
                  type="color"
                  value={draft.config?.address_block_bg || "#ffffff"}
                  onChange={(e) => updateConfig({ address_block_bg: e.target.value })}
                  className="h-7 w-10 rounded border border-neutral-200"
                />
                Cor do texto
                <input
                  type="color"
                  value={draft.config?.address_block_text || "#111111"}
                  onChange={(e) => updateConfig({ address_block_text: e.target.value })}
                  className="h-7 w-10 rounded border border-neutral-200"
                />
              </div>
            </>
          )}

          {draft.type === "booking" && (
            <p className="text-xs text-neutral-400">
              Vai abrir a página de agendamento em bioapp.vercel.app/{slug}/agendar
            </p>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={draft.pulse}
                onChange={(e) => setDraft((d) => ({ ...d, pulse: e.target.checked }))}
              />
              Efeito pulsar
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              Cor
              <input
                type="color"
                value={draft.color || "#ec4899"}
                onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
                className="h-7 w-10 rounded border border-neutral-200"
              />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveButton}
              disabled={saving}
              className="rounded-full bg-[#191970] px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {saving ? "Salvando..." : editingId ? "Salvar" : "Adicionar"}
            </button>
            <button onClick={resetForm} className="rounded-full px-5 py-2 text-sm font-medium text-neutral-500">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

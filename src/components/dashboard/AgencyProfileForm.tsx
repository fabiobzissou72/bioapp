"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadMedia } from "@/lib/upload";

export function AgencyProfileForm({
  userId,
  agencyName,
  agencyLogoUrl,
  agencyLink,
}: {
  userId: string;
  agencyName: string;
  agencyLogoUrl: string | null;
  agencyLink: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(agencyName);
  const [logoUrl, setLogoUrl] = useState(agencyLogoUrl);
  const [link, setLink] = useState(agencyLink);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const logoInput = useRef<HTMLInputElement>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, userId, "agency-logo");
      setLogoUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar o arquivo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ agency_name: name, agency_logo_url: logoUrl, agency_link: link })
      .eq("id", userId);
    setSaving(false);
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => logoInput.current?.click()}
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-full w-full object-cover" />
          ) : uploading ? (
            "..."
          ) : (
            "Logo"
          )}
        </button>
        <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        <p className="text-sm text-neutral-500">Logo da sua agência, exibida no rodapé dos biosites.</p>
      </div>

      <label className="flex flex-col gap-1 text-sm text-neutral-600">
        Nome da agência
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Vision Local"
          className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-neutral-600">
        Link do rodapé
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Ex: https://wa.me/5511999999999"
          className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm outline-none"
        />
        <span className="text-xs text-neutral-400">
          Pra onde vai quem clicar em &quot;feito por {name || "sua agência"}&quot; — normalmente o link do seu
          WhatsApp, pra gerar leads de quem viu o biosite.
        </span>
      </label>

      <button
        onClick={handleSave}
        disabled={saving}
        className="self-start rounded-full bg-pink-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </section>
  );
}

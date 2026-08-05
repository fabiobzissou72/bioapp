"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NotificationWebhookEditor({
  biositeId,
  webhookUrl,
}: {
  biositeId: string;
  webhookUrl: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [url, setUrl] = useState(webhookUrl || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await supabase.from("biosites").update({ notification_webhook_url: url || null }).eq("id", biositeId);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4">
      <p className="text-xs text-neutral-500">
        Sempre que alguém agendar ou cancelar nesse biosite, mandamos um POST com os dados pra essa URL. Conecte
        num fluxo do n8n (ou Zapier/Make) pra disparar um aviso no WhatsApp da empresa.
      </p>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://seu-n8n.com/webhook/agendamentos"
        className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm outline-none"
      />
      <button
        onClick={save}
        disabled={saving}
        className="self-start rounded-full bg-pink-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}

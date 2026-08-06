"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Row = {
  id: string;
  slug: string;
  business_name: string;
  owner_id: string;
  published: boolean;
  paid_until: string | null;
  admin_notes: string | null;
  business_whatsapp: string | null;
  created_at: string;
  agency_name: string;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addOneMonth(from: string | null) {
  const today = todayISO();
  const base = from && from > today ? from : today;
  const date = new Date(base + "T00:00:00");
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

function paymentBadge(paidUntil: string | null) {
  if (!paidUntil) return { label: "nunca pago", bg: "#fee2e2", text: "#991b1b" };
  const today = todayISO();
  const daysLeft = Math.round(
    (new Date(paidUntil + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000
  );
  const dateLabel = paidUntil.split("-").reverse().join("/");
  if (daysLeft < 0) return { label: `atrasado desde ${dateLabel}`, bg: "#fee2e2", text: "#991b1b" };
  if (daysLeft <= 7) return { label: `vence em ${daysLeft}d (${dateLabel})`, bg: "#fef9c3", text: "#854d0e" };
  return { label: `pago até ${dateLabel}`, bg: "#dcfce7", text: "#166534" };
}

function Row({ row }: { row: Row }) {
  const router = useRouter();
  const supabase = createClient();
  const [notes, setNotes] = useState(row.admin_notes || "");
  const [whatsapp, setWhatsapp] = useState(row.business_whatsapp || "");
  const badge = paymentBadge(row.paid_until);

  async function updatePaidUntil(date: string | null) {
    await supabase.from("biosites").update({ paid_until: date }).eq("id", row.id);
    router.refresh();
  }

  async function saveNotes() {
    await supabase.from("biosites").update({ admin_notes: notes || null }).eq("id", row.id);
    router.refresh();
  }

  async function saveWhatsapp() {
    await supabase.from("biosites").update({ business_whatsapp: whatsapp || null }).eq("id", row.id);
    router.refresh();
  }

  return (
    <tr className="border-b border-neutral-100">
      <td className="py-2 pr-3">
        <a href={`/${row.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-pink-600">
          {row.business_name}
        </a>
        <p className="text-xs text-neutral-400">/{row.slug}</p>
      </td>
      <td className="py-2 pr-3 text-neutral-600">{row.agency_name}</td>
      <td className="py-2 pr-3">
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: row.published ? "#dcfce7" : "#f3f4f6",
            color: row.published ? "#166534" : "#6b7280",
          }}
        >
          {row.published ? "ativo" : "pausado"}
        </span>
      </td>
      <td className="py-2 pr-3">
        <div className="flex items-center gap-1.5">
          <span
            className="whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: badge.bg, color: badge.text }}
          >
            {badge.label}
          </span>
          <button
            onClick={() => updatePaidUntil(addOneMonth(row.paid_until))}
            title="Marcar como pago por mais 1 mês"
            className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            +1 mês
          </button>
        </div>
        <input
          type="date"
          value={row.paid_until || ""}
          onChange={(e) => updatePaidUntil(e.target.value || null)}
          className="mt-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs"
        />
      </td>
      <td className="py-2 pr-3">
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          onBlur={saveWhatsapp}
          placeholder="5511999999999"
          className="w-32 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs"
        />
      </td>
      <td className="py-2 pr-3 text-xs text-neutral-400">
        {new Date(row.created_at).toLocaleDateString("pt-BR")}
      </td>
      <td className="py-2 pr-3">
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="anotação..."
          className="w-40 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs"
        />
      </td>
    </tr>
  );
}

export function SuperAdminTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-xs text-neutral-400">
            <th className="py-2 pr-3 font-medium">Biosite</th>
            <th className="py-2 pr-3 font-medium">Agência</th>
            <th className="py-2 pr-3 font-medium">Status</th>
            <th className="py-2 pr-3 font-medium">Pagamento</th>
            <th className="py-2 pr-3 font-medium">WhatsApp da empresa</th>
            <th className="py-2 pr-3 font-medium">Criado em</th>
            <th className="py-2 pr-3 font-medium">Anotação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Row key={row.id} row={row} />
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">Nenhum biosite ainda.</p>}
    </div>
  );
}

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
  payment_status: string;
  admin_notes: string | null;
  created_at: string;
  agency_name: string;
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pago: { bg: "#dcfce7", text: "#166534" },
  pendente: { bg: "#fef9c3", text: "#854d0e" },
  atrasado: { bg: "#fee2e2", text: "#991b1b" },
};

function Row({ row }: { row: Row }) {
  const router = useRouter();
  const supabase = createClient();
  const [notes, setNotes] = useState(row.admin_notes || "");

  async function updateStatus(status: string) {
    await supabase.from("biosites").update({ payment_status: status }).eq("id", row.id);
    router.refresh();
  }

  async function saveNotes() {
    await supabase.from("biosites").update({ admin_notes: notes || null }).eq("id", row.id);
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
        <select
          value={row.payment_status}
          onChange={(e) => updateStatus(e.target.value)}
          className="rounded-full border-0 px-2 py-1 text-xs font-medium"
          style={{
            backgroundColor: STATUS_COLORS[row.payment_status]?.bg,
            color: STATUS_COLORS[row.payment_status]?.text,
          }}
        >
          <option value="pago">pago</option>
          <option value="pendente">pendente</option>
          <option value="atrasado">atrasado</option>
        </select>
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

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Lead = {
  id: string;
  niche: string | null;
  city: string | null;
  instagram_handle: string;
  profile_url: string | null;
  full_name: string | null;
  bio_text: string | null;
  has_link_in_bio: boolean;
  is_target: boolean | null;
  ai_reasoning: string | null;
  suggested_approach: string | null;
  status: string;
  captured_at: string;
};

const STATUS_OPTIONS = ["novo", "contatado", "respondeu", "fechado", "descartado"];

function LeadRow({ lead }: { lead: Lead }) {
  const router = useRouter();
  const supabase = createClient();
  const [copied, setCopied] = useState(false);

  async function updateStatus(status: string) {
    await supabase.from("leads").update({ status }).eq("id", lead.id);
    router.refresh();
  }

  async function copyApproach() {
    if (!lead.suggested_approach) return;
    await navigator.clipboard.writeText(lead.suggested_approach);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <tr className="border-b border-neutral-100 align-top">
      <td className="py-3 pr-3">
        <a
          href={lead.profile_url || `https://instagram.com/${lead.instagram_handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-pink-600"
        >
          @{lead.instagram_handle}
        </a>
        <p className="text-xs text-neutral-400">{lead.full_name}</p>
        <p className="mt-1 text-xs text-neutral-400">
          {lead.niche} · {lead.city}
        </p>
      </td>
      <td className="py-3 pr-3 max-w-56">
        <p className="text-xs text-neutral-600">{lead.bio_text || "(sem bio)"}</p>
        <span
          className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: lead.is_target ? "#dcfce7" : "#f3f4f6",
            color: lead.is_target ? "#166534" : "#6b7280",
          }}
        >
          {lead.is_target ? "alvo bom" : "não é alvo"}
        </span>
      </td>
      <td className="py-3 pr-3 max-w-72">
        <p className="text-xs text-neutral-600">{lead.suggested_approach}</p>
        {lead.suggested_approach && (
          <button onClick={copyApproach} className="mt-1 text-xs font-medium text-pink-600">
            {copied ? "copiado!" : "copiar abordagem"}
          </button>
        )}
      </td>
      <td className="py-3 pr-3">
        <select
          value={lead.status}
          onChange={(e) => updateStatus(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>
      <td className="py-3 pr-3 text-xs text-neutral-400">
        {new Date(lead.captured_at).toLocaleDateString("pt-BR")}
      </td>
    </tr>
  );
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [nicheFilter, setNicheFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [onlyTargets, setOnlyTargets] = useState(false);

  const niches = useMemo(() => [...new Set(leads.map((l) => l.niche).filter(Boolean))], [leads]);
  const cities = useMemo(() => [...new Set(leads.map((l) => l.city).filter(Boolean))], [leads]);

  const filtered = leads.filter((l) => {
    if (nicheFilter && l.niche !== nicheFilter) return false;
    if (cityFilter && l.city !== cityFilter) return false;
    if (onlyTargets && !l.is_target) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={nicheFilter}
          onChange={(e) => setNicheFilter(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-sm"
        >
          <option value="">Todos os nichos</option>
          {niches.map((n) => (
            <option key={n} value={n!}>
              {n}
            </option>
          ))}
        </select>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-sm"
        >
          <option value="">Todas as cidades</option>
          {cities.map((c) => (
            <option key={c} value={c!}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-neutral-600">
          <input type="checkbox" checked={onlyTargets} onChange={(e) => setOnlyTargets(e.target.checked)} />
          Só alvos bons
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs text-neutral-400">
              <th className="py-2 pr-3 font-medium">Perfil</th>
              <th className="py-2 pr-3 font-medium">Bio / classificação</th>
              <th className="py-2 pr-3 font-medium">Abordagem sugerida</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 pr-3 font-medium">Capturado em</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-neutral-400">Nenhum lead capturado ainda.</p>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import type { Biosite } from "@/lib/types";

export function BiositeCard({ biosite }: { biosite: Biosite }) {
  return (
    <Link
      href={`/painel/${biosite.id}`}
      className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3 hover:border-pink-300"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: biosite.primary_color }}
      >
        {biosite.business_name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-neutral-900">{biosite.business_name}</p>
        <p className="truncate text-sm text-neutral-500">/{biosite.slug}</p>
      </div>
      <span
        className="shrink-0 rounded-full px-2 py-1 text-xs font-medium"
        style={{
          backgroundColor: biosite.published ? "#dcfce7" : "#f3f4f6",
          color: biosite.published ? "#166534" : "#6b7280",
        }}
      >
        {biosite.published ? "publicado" : "rascunho"}
      </span>
    </Link>
  );
}

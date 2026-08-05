"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/painel", label: "Meus sites", icon: "🗂️" },
  { href: "/painel/perfil", label: "Meu perfil", icon: "👤" },
];

export function Sidebar({
  agencyName,
  biositeCount,
  planLimit,
  isSuperAdmin,
}: {
  agencyName: string;
  biositeCount: number;
  planLimit: number;
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col justify-between border-r border-neutral-200 bg-white p-4">
      <div>
        <h1 className="mb-6 truncate text-lg font-bold text-neutral-900">{agencyName}</h1>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? "bg-pink-50 text-pink-600" : "text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
          {isSuperAdmin && (
            <Link
              href="/superadmin"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                pathname === "/superadmin" ? "bg-purple-50 text-purple-600" : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <span>🛠️</span>
              Super Admin
            </Link>
          )}
        </nav>
      </div>

      <div className="flex flex-col gap-3">
        <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-500">
          <p className="font-medium text-neutral-700">Plano</p>
          <p>
            {biositeCount}/{planLimit} sites usados
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-500 hover:bg-neutral-50"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}

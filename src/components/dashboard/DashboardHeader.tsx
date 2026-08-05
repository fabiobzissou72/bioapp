"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DashboardHeader({ agencyName }: { agencyName: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold text-neutral-900">{agencyName}</h1>
      <div className="flex items-center gap-4">
        <Link href="/painel/perfil" className="text-sm text-neutral-500 hover:text-neutral-800">
          Meu perfil
        </Link>
        <button onClick={handleLogout} className="text-sm text-neutral-500 hover:text-neutral-800">
          Sair
        </button>
      </div>
    </div>
  );
}

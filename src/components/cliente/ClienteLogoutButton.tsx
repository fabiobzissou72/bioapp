"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ClienteLogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/cliente/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="text-sm text-neutral-500 hover:text-neutral-800">
      Sair
    </button>
  );
}

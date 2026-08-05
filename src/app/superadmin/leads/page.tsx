import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LeadsTable } from "@/components/superadmin/LeadsTable";

export const revalidate = 0;

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_super_admin) redirect("/painel");

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("owner_id", user.id)
    .order("captured_at", { ascending: false });

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-16 pt-6">
      <Link href="/superadmin" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← Voltar
      </Link>
      <h1 className="mb-1 mt-4 text-xl font-bold text-neutral-900">Leads capturados (Instagram)</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Capturados pela extensão Chrome. Total: {leads?.length || 0}
      </p>
      <LeadsTable leads={leads || []} />
    </main>
  );
}

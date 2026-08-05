import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuperAdminTable } from "@/components/superadmin/SuperAdminTable";

export const revalidate = 0;

export default async function SuperAdminPage() {
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

  const [{ data: biosites }, { data: profiles }] = await Promise.all([
    supabase
      .from("biosites")
      .select("id, slug, business_name, owner_id, published, payment_status, admin_notes, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, agency_name"),
  ]);

  const agencyNameByOwner = new Map((profiles || []).map((p) => [p.id, p.agency_name || "—"]));

  const rows = (biosites || []).map((b) => ({
    ...b,
    agency_name: agencyNameByOwner.get(b.owner_id) || "—",
  }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-16 pt-6">
      <h1 className="mb-1 text-xl font-bold text-neutral-900">Super Admin — Empresas cadastradas</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Todos os biosites de todas as agências. Total: {rows.length}
      </p>
      <SuperAdminTable rows={rows} />
    </main>
  );
}

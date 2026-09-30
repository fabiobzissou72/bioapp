import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("profiles").select("agency_name, plan_limit, is_super_admin").eq("id", user.id).single(),
    supabase.from("biosites").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        agencyName={profile?.agency_name || "Sua agência"}
        biositeCount={count || 0}
        planLimit={profile?.plan_limit || 30}
        isSuperAdmin={profile?.is_super_admin || false}
      />
      <div className="min-h-screen flex-1 bg-[#faf9f5]">{children}</div>
    </div>
  );
}

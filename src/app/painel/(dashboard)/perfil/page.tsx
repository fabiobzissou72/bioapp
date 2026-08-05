import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgencyProfileForm } from "@/components/dashboard/AgencyProfileForm";

export const revalidate = 0;

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_name, agency_logo_url, agency_link")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-4 pb-16 pt-6">
      <h1 className="mb-1 text-xl font-bold text-neutral-900">Meu perfil</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Essas informações aparecem no rodapé de todos os biosites que você criar (&quot;feito por...&quot;).
      </p>

      <AgencyProfileForm
        userId={user.id}
        agencyName={profile?.agency_name || ""}
        agencyLogoUrl={profile?.agency_logo_url || null}
        agencyLink={profile?.agency_link || ""}
      />
    </main>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateBiositeForm } from "@/components/dashboard/CreateBiositeForm";
import { BiositeCard } from "@/components/dashboard/BiositeCard";

export const revalidate = 0;

export default async function PainelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_limit")
    .eq("id", user.id)
    .single();

  const { data: biosites } = await supabase
    .from("biosites")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const count = biosites?.length ?? 0;
  const limit = profile?.plan_limit ?? 30;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-10 pt-6">
      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-[#191970]">Bio Insta</p>
        <h1 className="text-2xl font-extrabold text-neutral-900 sm:text-3xl">Meu painel</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Seus biosites ({count}/{limit})
        </p>
      </div>

      <CreateBiositeForm
        disabled={count >= limit}
        cloneOptions={(biosites || []).map((b) => ({ id: b.id, business_name: b.business_name }))}
      />

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(biosites || []).map((b) => (
          <BiositeCard key={b.id} biosite={b} />
        ))}
      </div>

      {count === 0 && (
        <p className="mt-10 text-center text-sm text-neutral-400">
          Nenhum biosite ainda. Crie o primeiro acima.
        </p>
      )}
    </main>
  );
}

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
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-10 pt-6">
      <h2 className="text-lg font-semibold text-neutral-900">
        Seus biosites ({count}/{limit})
      </h2>

      <div className="mt-4">
        <CreateBiositeForm disabled={count >= limit} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
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

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

const TYPE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  google_review: "Avaliação Google",
  pix: "Pix",
  wifi: "Wi-Fi",
  address: "Endereço",
  booking: "Agendamento",
  custom: "Link personalizado",
};

export default async function StatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: biosite } = await supabase
    .from("biosites")
    .select("id, slug, business_name")
    .eq("id", id)
    .single();
  if (!biosite) notFound();

  const [{ data: clicks }, { data: buttons }] = await Promise.all([
    supabase
      .from("clicks")
      .select("id, button_id, device, source, created_at")
      .eq("biosite_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("buttons").select("id, type, label").eq("biosite_id", id),
  ]);

  const buttonsById = new Map((buttons || []).map((b) => [b.id, b]));
  const total = clicks?.length ?? 0;

  const byButton = new Map<string, number>();
  const byDevice = new Map<string, number>();
  const bySource = new Map<string, number>();

  for (const click of clicks || []) {
    const button = click.button_id ? buttonsById.get(click.button_id) : null;
    const buttonKey = button ? button.label || TYPE_LABELS[button.type] || button.type : "página";
    byButton.set(buttonKey, (byButton.get(buttonKey) || 0) + 1);
    byDevice.set(click.device || "desconhecido", (byDevice.get(click.device || "desconhecido") || 0) + 1);
    bySource.set(click.source || "direto", (bySource.get(click.source || "direto") || 0) + 1);
  }

  const sortedEntries = (map: Map<string, number>) =>
    Array.from(map.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-16 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/painel/${id}`} className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Voltar pro editor
        </Link>
      </div>

      <h1 className="mb-1 text-xl font-bold text-neutral-900">Estatísticas — {biosite.business_name}</h1>
      <p className="mb-6 text-sm text-neutral-500">Cliques registrados desde a criação do biosite.</p>

      <div className="mb-6 rounded-xl border border-neutral-200 p-4">
        <p className="text-3xl font-bold text-neutral-900">{total}</p>
        <p className="text-sm text-neutral-500">cliques no total</p>
      </div>

      {total === 0 ? (
        <p className="text-sm text-neutral-400">
          Ainda não há cliques registrados. Compartilhe o link do biosite pra começar a ver dados aqui.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 p-4">
            <h3 className="mb-2 text-sm font-semibold text-neutral-900">Por botão</h3>
            <div className="flex flex-col gap-1 text-sm">
              {sortedEntries(byButton).map(([key, value]) => (
                <div key={key} className="flex justify-between text-neutral-600">
                  <span>{key}</span>
                  <span className="font-medium text-neutral-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 p-4">
            <h3 className="mb-2 text-sm font-semibold text-neutral-900">Dispositivo</h3>
            <div className="flex flex-col gap-1 text-sm">
              {sortedEntries(byDevice).map(([key, value]) => (
                <div key={key} className="flex justify-between text-neutral-600">
                  <span className="capitalize">{key}</span>
                  <span className="font-medium text-neutral-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 p-4">
            <h3 className="mb-2 text-sm font-semibold text-neutral-900">Origem</h3>
            <div className="flex flex-col gap-1 truncate text-sm">
              {sortedEntries(bySource)
                .slice(0, 8)
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2 text-neutral-600">
                    <span className="truncate">{key}</span>
                    <span className="shrink-0 font-medium text-neutral-900">{value}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClienteLogoutButton } from "@/components/cliente/ClienteLogoutButton";
import { BookingCard } from "@/components/cliente/BookingCard";

export const revalidate = 0;

export default async function ClientePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) redirect("/cliente/login");

  const { data: access } = await supabase
    .from("client_access")
    .select("biosite_id")
    .eq("email", user.email)
    .limit(1)
    .maybeSingle();

  if (!access) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-neutral-500">
          Esse e-mail ainda não tem acesso a nenhum biosite. Fale com quem criou seu site.
        </p>
        <ClienteLogoutButton />
      </main>
    );
  }

  const { data: biosite } = await supabase
    .from("biosites")
    .select("business_name, primary_color, logo_url")
    .eq("id", access.biosite_id)
    .single();

  const primaryColor = biosite?.primary_color || "#ec4899";

  const { count: totalClicks } = await supabase
    .from("clicks")
    .select("id", { count: "exact", head: true })
    .eq("biosite_id", access.biosite_id);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, customer_name, customer_phone, notes, booking_date, booking_time, status, service_id, staff_id")
    .eq("biosite_id", access.biosite_id)
    .order("booking_date", { ascending: false })
    .order("booking_time", { ascending: false });

  const [{ data: services }, { data: staff }] = await Promise.all([
    supabase.from("services").select("id, name").eq("biosite_id", access.biosite_id),
    supabase.from("staff").select("id, name").eq("biosite_id", access.biosite_id),
  ]);
  const servicesById = new Map((services || []).map((s) => [s.id, s.name]));
  const staffById = new Map((staff || []).map((s) => [s.id, s.name]));

  const todayISO = new Date().toISOString().slice(0, 10);
  const upcoming = (bookings || []).filter((b) => b.booking_date >= todayISO && b.status !== "cancelled");
  const past = (bookings || []).filter((b) => b.booking_date < todayISO || b.status === "cancelled");

  return (
    <main className="min-h-screen bg-neutral-50 pb-16">
      <div className="px-4 pt-8 pb-6 text-white" style={{ backgroundColor: primaryColor }}>
        <div className="mx-auto flex w-full max-w-md items-center justify-between">
          <div className="flex items-center gap-3">
            {biosite?.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={biosite.logo_url}
                alt=""
                className="h-12 w-12 rounded-full border-2 border-white/60 object-cover"
              />
            )}
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Painel do cliente</p>
              <h1 className="text-lg font-bold">{biosite?.business_name}</h1>
            </div>
          </div>
          <ClienteLogoutButton />
        </div>
      </div>

      <div className="mx-auto -mt-4 w-full max-w-md px-4">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
          <div className="text-center">
            <p className="text-xl font-bold text-neutral-900">{upcoming.length}</p>
            <p className="text-xs text-neutral-500">próximos</p>
          </div>
          <div className="border-x border-neutral-100 text-center">
            <p className="text-xl font-bold text-neutral-900">{(bookings || []).length}</p>
            <p className="text-xs text-neutral-500">total agendado</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-neutral-900">{totalClicks || 0}</p>
            <p className="text-xs text-neutral-500">cliques no site</p>
          </div>
        </div>

        <h2 className="mb-3 mt-8 text-sm font-semibold text-neutral-700">
          Próximos agendamentos ({upcoming.length})
        </h2>
        <div className="mb-8 flex flex-col gap-3">
          {upcoming.length === 0 && (
            <p className="rounded-xl border border-dashed border-neutral-200 py-6 text-center text-sm text-neutral-400">
              Nenhum agendamento futuro.
            </p>
          )}
          {upcoming.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              serviceName={(b.service_id && servicesById.get(b.service_id)) || "Serviço"}
              staffName={(b.staff_id && staffById.get(b.staff_id)) || null}
              primaryColor={primaryColor}
              canCancel
            />
          ))}
        </div>

        <h2 className="mb-3 text-sm font-semibold text-neutral-700">Histórico ({past.length})</h2>
        <div className="flex flex-col gap-3">
          {past.length === 0 && (
            <p className="rounded-xl border border-dashed border-neutral-200 py-6 text-center text-sm text-neutral-400">
              Nada por aqui ainda.
            </p>
          )}
          {past.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              serviceName={(b.service_id && servicesById.get(b.service_id)) || "Serviço"}
              staffName={(b.staff_id && staffById.get(b.staff_id)) || null}
              primaryColor={primaryColor}
              canCancel={false}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

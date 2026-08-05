import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClienteLogoutButton } from "@/components/cliente/ClienteLogoutButton";

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
    .select("business_name, primary_color")
    .eq("id", access.biosite_id)
    .single();

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

  function BookingRow({ b }: { b: (typeof upcoming)[number] }) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-neutral-200 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium text-neutral-900">
            {b.booking_date.split("-").reverse().join("/")} às {b.booking_time.slice(0, 5)}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: b.status === "cancelled" ? "#fee2e2" : "#dcfce7",
              color: b.status === "cancelled" ? "#991b1b" : "#166534",
            }}
          >
            {b.status === "cancelled" ? "cancelado" : b.status === "completed" ? "concluído" : "confirmado"}
          </span>
        </div>
        <p className="text-neutral-600">
          {b.service_id ? servicesById.get(b.service_id) || "Serviço" : "Serviço"}
          {b.staff_id ? ` · ${staffById.get(b.staff_id) || ""}` : ""}
        </p>
        <p className="text-neutral-500">
          {b.customer_name} · {b.customer_phone}
        </p>
        {b.notes && <p className="text-neutral-400">{b.notes}</p>}
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-16 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">{biosite?.business_name}</h1>
        <ClienteLogoutButton />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-neutral-700">
        Próximos agendamentos ({upcoming.length})
      </h2>
      <div className="mb-8 flex flex-col gap-2">
        {upcoming.length === 0 && <p className="text-sm text-neutral-400">Nenhum agendamento futuro.</p>}
        {upcoming.map((b) => (
          <BookingRow key={b.id} b={b} />
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold text-neutral-700">Histórico ({past.length})</h2>
      <div className="flex flex-col gap-2">
        {past.map((b) => (
          <BookingRow key={b.id} b={b} />
        ))}
      </div>
    </main>
  );
}

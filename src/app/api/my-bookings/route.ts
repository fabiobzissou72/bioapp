import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyWebhook } from "@/lib/notifyWebhook";

// Self-service booking lookup/cancel for anonymous end customers, identified
// only by the booking UUID their browser stored in localStorage after
// booking (never listed/enumerable — this route only ever looks up exact
// IDs the caller already has, it never lists bookings by biosite).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids") || "";
  const ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 20);
  if (ids.length === 0) return NextResponse.json({ bookings: [] });

  const admin = createAdminClient();
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, booking_date, booking_time, status, service_id")
    .in("id", ids);

  const serviceIds = [...new Set((bookings || []).map((b) => b.service_id).filter(Boolean))];
  const { data: services } = serviceIds.length
    ? await admin.from("services").select("id, name").in("id", serviceIds)
    : { data: [] };
  const serviceNameById = new Map((services || []).map((s) => [s.id, s.name]));

  return NextResponse.json({
    bookings: (bookings || []).map((b) => ({
      id: b.id,
      booking_date: b.booking_date,
      booking_time: b.booking_time,
      status: b.status,
      service_name: (b.service_id && serviceNameById.get(b.service_id)) || "Serviço",
    })),
  });
}

export async function POST(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Faltou o id." }, { status: 400 });

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, biosite_id, service_id, customer_name, customer_phone, booking_date, booking_time")
    .eq("id", id)
    .single();
  if (!booking) return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  if (booking.status === "cancelled") return NextResponse.json({ ok: true });

  const { error } = await admin.from("bookings").update({ status: "cancelled" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const [{ data: biosite }, { data: service }] = await Promise.all([
    admin.from("biosites").select("business_name, notification_webhook_url").eq("id", booking.biosite_id).single(),
    booking.service_id
      ? admin.from("services").select("name").eq("id", booking.service_id).single()
      : Promise.resolve({ data: null }),
  ]);

  notifyWebhook(biosite?.notification_webhook_url, "booking.cancelled", {
    business_name: biosite?.business_name,
    service_name: service?.name,
    customer_name: booking.customer_name,
    customer_phone: booking.customer_phone,
    booking_date: booking.booking_date,
    booking_time: booking.booking_time,
    cancelled_by: "customer",
  });

  return NextResponse.json({ ok: true });
}

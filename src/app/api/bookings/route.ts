import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyWebhook } from "@/lib/notifyWebhook";

export async function POST(request: Request) {
  const { biositeId, serviceId, staffId, customerName, customerPhone, notes, bookingDate, bookingTime } =
    await request.json();

  if (!biositeId || !serviceId || !customerName || !customerPhone || !bookingDate || !bookingTime) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: biosite } = await admin
    .from("biosites")
    .select("business_name, published, notification_webhook_url, business_whatsapp")
    .eq("id", biositeId)
    .single();
  if (!biosite?.published) {
    return NextResponse.json({ error: "Biosite não encontrado." }, { status: 404 });
  }

  const { data: booking, error } = await admin
    .from("bookings")
    .insert({
      biosite_id: biositeId,
      service_id: serviceId,
      staff_id: staffId || null,
      customer_name: customerName,
      customer_phone: customerPhone,
      notes: notes || null,
      booking_date: bookingDate,
      booking_time: bookingTime,
    })
    .select("id")
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: error?.message || "Erro ao agendar." }, { status: 400 });
  }

  const [{ data: service }, { data: staff }] = await Promise.all([
    admin.from("services").select("name").eq("id", serviceId).single(),
    staffId ? admin.from("staff").select("name").eq("id", staffId).single() : Promise.resolve({ data: null }),
  ]);

  // Must be awaited — on Vercel, unawaited work after the response is sent
  // is not guaranteed to run to completion (the function can freeze/exit).
  await notifyWebhook(biosite.notification_webhook_url, "booking.created", {
    business_name: biosite.business_name,
    business_whatsapp: biosite.business_whatsapp,
    service_name: service?.name,
    staff_name: staff?.name || null,
    customer_name: customerName,
    customer_phone: customerPhone,
    booking_date: bookingDate,
    booking_time: bookingTime,
    notes: notes || null,
  });

  return NextResponse.json({ id: booking.id });
}

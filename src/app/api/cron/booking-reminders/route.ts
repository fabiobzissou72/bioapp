import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyWebhook } from "@/lib/notifyWebhook";

const REMINDER_24H_MS = 24 * 60 * 60 * 1000;
const REMINDER_1H_MS = 60 * 60 * 1000;

// Bio Insta only serves Brazilian businesses; booking_date/booking_time are
// stored as plain local (America/Sao_Paulo, UTC-3, no DST) values.
function bookingUtcMs(date: string, time: string) {
  return new Date(`${date}T${time}-03:00`).getTime();
}

// Polled externally (an n8n Schedule Trigger, not a Vercel Cron — the Hobby
// plan only allows daily-frequency native crons) every ~15min. Finds
// upcoming confirmed bookings that opted into a reminder and are now past
// the 24h-before or 1h-before threshold, fires booking.reminder to the
// biosite's webhook, and marks that reminder sent so it's never repeated.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const todayISO = new Date().toISOString().slice(0, 10);

  const { data: bookings } = await admin
    .from("bookings")
    .select(
      "id, biosite_id, service_id, customer_name, customer_phone, booking_date, booking_time, reminder_24h_sent_at, reminder_1h_sent_at"
    )
    .eq("wants_reminder", true)
    .eq("status", "confirmed")
    .gte("booking_date", todayISO)
    .or("reminder_24h_sent_at.is.null,reminder_1h_sent_at.is.null");

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const biositeIds = [...new Set(bookings.map((b) => b.biosite_id))];
  const serviceIds = [...new Set(bookings.map((b) => b.service_id).filter(Boolean))];

  const [{ data: biosites }, { data: services }] = await Promise.all([
    admin.from("biosites").select("id, business_name, notification_webhook_url").in("id", biositeIds),
    serviceIds.length
      ? admin.from("services").select("id, name").in("id", serviceIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const biositeById = new Map((biosites || []).map((b) => [b.id, b]));
  const serviceNameById = new Map((services || []).map((s) => [s.id, s.name]));

  const now = Date.now();
  let sent = 0;

  for (const booking of bookings) {
    const biosite = biositeById.get(booking.biosite_id);
    if (!biosite) continue;

    const bookingMs = bookingUtcMs(booking.booking_date, booking.booking_time);
    if (bookingMs <= now) continue;

    const due24h = !booking.reminder_24h_sent_at && now >= bookingMs - REMINDER_24H_MS;
    const due1h = !booking.reminder_1h_sent_at && now >= bookingMs - REMINDER_1H_MS;

    const basePayload = {
      business_name: biosite.business_name,
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      service_name: booking.service_id ? serviceNameById.get(booking.service_id) || null : null,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time,
    };

    if (due24h) {
      await notifyWebhook(biosite.notification_webhook_url, "booking.reminder", {
        reminder_type: "24h",
        ...basePayload,
      });
      await admin.from("bookings").update({ reminder_24h_sent_at: new Date().toISOString() }).eq("id", booking.id);
      sent++;
    }
    if (due1h) {
      await notifyWebhook(biosite.notification_webhook_url, "booking.reminder", {
        reminder_type: "1h",
        ...basePayload,
      });
      await admin.from("bookings").update({ reminder_1h_sent_at: new Date().toISOString() }).eq("id", booking.id);
      sent++;
    }
  }

  return NextResponse.json({ sent });
}

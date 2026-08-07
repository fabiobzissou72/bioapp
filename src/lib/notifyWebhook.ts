// Fire-and-forget POST to the agency's own automation (n8n, Zapier, etc).
// Never blocks or fails the booking flow if the webhook is down/unset.
export async function notifyWebhook(
  webhookUrl: string | null | undefined,
  event: "booking.created" | "booking.cancelled" | "booking.reminder",
  payload: Record<string, unknown>
) {
  if (!webhookUrl) {
    console.log(`[notifyWebhook] skipped ${event}: no webhook_url configured`);
    return;
  }
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ...payload }),
      signal: AbortSignal.timeout(8000),
    });
    console.log(`[notifyWebhook] ${event} -> ${webhookUrl} responded ${res.status}`);
  } catch (err) {
    // Best-effort only — a broken webhook must never break booking/cancellation —
    // but log it so failures are actually visible instead of silent.
    console.error(`[notifyWebhook] ${event} -> ${webhookUrl} failed:`, err);
  }
}

// Fire-and-forget POST to the agency's own automation (n8n, Zapier, etc).
// Never blocks or fails the booking flow if the webhook is down/unset.
export async function notifyWebhook(
  webhookUrl: string | null | undefined,
  event: "booking.created" | "booking.cancelled",
  payload: Record<string, unknown>
) {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ...payload }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Best-effort only — a broken webhook must never break booking/cancellation.
  }
}

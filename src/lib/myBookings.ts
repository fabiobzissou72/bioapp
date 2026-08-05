// Remembers which bookings this browser made, per biosite, so the customer
// can see/cancel "their" bookings on a return visit without any login.
const storageKey = (biositeId: string) => `bioinsta_bookings_${biositeId}`;

export function rememberBooking(biositeId: string, bookingId: string) {
  const existing = getStoredBookingIds(biositeId);
  if (existing.includes(bookingId)) return;
  localStorage.setItem(storageKey(biositeId), JSON.stringify([...existing, bookingId]));
}

export function getStoredBookingIds(biositeId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(biositeId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function forgetBooking(biositeId: string, bookingId: string) {
  const remaining = getStoredBookingIds(biositeId).filter((id) => id !== bookingId);
  localStorage.setItem(storageKey(biositeId), JSON.stringify(remaining));
}

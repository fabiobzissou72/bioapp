"use client";

import { useEffect, useState } from "react";
import { getStoredBookingIds, forgetBooking } from "@/lib/myBookings";

type MyBooking = {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  service_name: string;
};

export function MyBookings({ biositeId }: { biositeId: string }) {
  const [bookings, setBookings] = useState<MyBooking[] | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const ids = getStoredBookingIds(biositeId);
    fetch(`/api/my-bookings?ids=${ids.join(",")}`)
      .then((res) => res.json())
      .then((data) => setBookings(data.bookings || []));
  }, [biositeId]);

  async function cancelBooking(id: string) {
    if (!confirm("Cancelar esse agendamento?")) return;
    setCancellingId(id);
    await fetch("/api/my-bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBookings((prev) => prev?.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)) || null);
    forgetBooking(biositeId, id);
    setCancellingId(null);
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  const upcoming = (bookings || []).filter((b) => b.booking_date >= todayISO && b.status === "confirmed");

  if (!bookings || upcoming.length === 0) return null;

  return (
    <section className="mb-5 rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-semibold text-neutral-700">Seus agendamentos</h2>
      <div className="flex flex-col gap-2">
        {upcoming.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm">
            <span className="text-neutral-700">
              {b.service_name} · {b.booking_date.split("-").reverse().join("/")} às {b.booking_time.slice(0, 5)}
            </span>
            <button
              onClick={() => cancelBooking(b.id)}
              disabled={cancellingId === b.id}
              className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-40"
              style={{ color: cancellingId === b.id ? undefined : undefined }}
            >
              {cancellingId === b.id ? "Cancelando..." : "Cancelar"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

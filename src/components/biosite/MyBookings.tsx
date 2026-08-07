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

export function MyBookings({ biositeId, dark = false }: { biositeId: string; dark?: boolean }) {
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
    <section
      className={`mb-5 rounded-xl border p-4 ${
        dark ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-white"
      }`}
    >
      <h2 className={`mb-2 text-sm font-semibold ${dark ? "text-neutral-300" : "text-neutral-700"}`}>
        Seus agendamentos
      </h2>
      <div className="flex flex-col gap-2">
        {upcoming.map((b) => (
          <div
            key={b.id}
            className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
              dark ? "bg-neutral-800" : "bg-neutral-50"
            }`}
          >
            <span className={`flex-1 ${dark ? "text-neutral-300" : "text-neutral-700"}`}>
              {b.service_name} · {b.booking_date.split("-").reverse().join("/")} às {b.booking_time.slice(0, 5)}
            </span>
            <button
              onClick={() => cancelBooking(b.id)}
              disabled={cancellingId === b.id}
              className="shrink-0 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-40"
            >
              {cancellingId === b.id ? "Cancelando..." : "Cancelar"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

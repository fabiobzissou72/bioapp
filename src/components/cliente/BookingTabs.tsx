"use client";

import { useState } from "react";
import { BookingCard } from "./BookingCard";

type Booking = {
  id: string;
  customer_name: string;
  customer_phone: string;
  notes: string | null;
  booking_date: string;
  booking_time: string;
  status: string;
  service_id: string | null;
  staff_id: string | null;
};

type Tab = "upcoming" | "history" | "cancelled";

export function BookingTabs({
  upcoming,
  history,
  cancelled,
  servicesById,
  staffById,
  primaryColor,
}: {
  upcoming: Booking[];
  history: Booking[];
  cancelled: Booking[];
  servicesById: Record<string, string>;
  staffById: Record<string, string>;
  primaryColor: string;
}) {
  const [tab, setTab] = useState<Tab>("upcoming");

  const lists: Record<Tab, { label: string; items: Booking[]; canCancel: boolean; empty: string }> = {
    upcoming: { label: "Próximos", items: upcoming, canCancel: true, empty: "Nenhum agendamento futuro." },
    history: { label: "Histórico", items: history, canCancel: false, empty: "Nada por aqui ainda." },
    cancelled: { label: "Cancelados", items: cancelled, canCancel: false, empty: "Nenhum cancelamento." },
  };

  return (
    <div>
      <div className="mb-3 flex gap-1 rounded-full bg-neutral-100 p-1">
        {(Object.keys(lists) as Tab[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 rounded-full py-1.5 text-xs font-medium transition"
            style={
              tab === key
                ? { backgroundColor: primaryColor, color: "#fff" }
                : { color: "#525252" }
            }
          >
            {lists[key].label} ({lists[key].items.length})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {lists[tab].items.length === 0 && (
          <p className="rounded-xl border border-dashed border-neutral-200 py-6 text-center text-sm text-neutral-400">
            {lists[tab].empty}
          </p>
        )}
        {lists[tab].items.map((b) => (
          <BookingCard
            key={b.id}
            booking={b}
            serviceName={(b.service_id && servicesById[b.service_id]) || "Serviço"}
            staffName={(b.staff_id && staffById[b.staff_id]) || null}
            primaryColor={primaryColor}
            canCancel={lists[tab].canCancel}
          />
        ))}
      </div>
    </div>
  );
}

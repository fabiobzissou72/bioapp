"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

const STATUS_LABEL: Record<string, string> = {
  cancelled: "cancelado",
  completed: "concluído",
  confirmed: "confirmado",
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  cancelled: { bg: "#fee2e2", text: "#991b1b" },
  completed: { bg: "#e0e7ff", text: "#3730a3" },
  confirmed: { bg: "#dcfce7", text: "#166534" },
};

export function BookingCard({
  booking,
  serviceName,
  staffName,
  primaryColor,
  canCancel,
}: {
  booking: Booking;
  serviceName: string;
  staffName: string | null;
  primaryColor: string;
  canCancel: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [cancelling, setCancelling] = useState(false);

  async function handleCancel() {
    if (!confirm("Cancelar esse agendamento? O horário volta a ficar disponível.")) return;
    setCancelling(true);
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
    setCancelling(false);
    router.refresh();
  }

  const whatsappDigits = booking.customer_phone.replace(/\D/g, "");
  const statusColor = STATUS_COLOR[booking.status] || STATUS_COLOR.confirmed;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: `${primaryColor}0f` }}>
        <span className="font-semibold text-neutral-900">
          {booking.booking_date.split("-").reverse().join("/")} às {booking.booking_time.slice(0, 5)}
        </span>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
        >
          {STATUS_LABEL[booking.status] || booking.status}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <p className="text-sm font-medium text-neutral-800">
          {serviceName}
          {staffName ? ` · ${staffName}` : ""}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">{booking.customer_name}</p>
          <a
            href={`https://wa.me/${whatsappDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-medium"
            style={{ color: primaryColor }}
          >
            💬 {booking.customer_phone}
          </a>
        </div>
        {booking.notes && <p className="rounded-lg bg-neutral-50 p-2 text-xs text-neutral-500">{booking.notes}</p>}
        {canCancel && booking.status === "confirmed" && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="mt-1 self-start text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-40"
          >
            {cancelling ? "Cancelando..." : "Cancelar agendamento"}
          </button>
        )}
      </div>
    </div>
  );
}

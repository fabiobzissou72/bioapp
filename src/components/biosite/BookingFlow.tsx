"use client";

import { useCallback, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonthCalendar } from "@/components/ui/MonthCalendar";
import { rememberBooking } from "@/lib/myBookings";
import type { Service, Staff } from "@/lib/types";

type Availability = { id: string; staff_id: string; weekday: number; start_time: string; end_time: string };
type StaffService = {
  staff_id: string;
  service_id: string;
  price_override: number | null;
  duration_override: number | null;
};
type OccupiedBlock = { start: number; end: number };

function toTimeMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToLabel(minutes: number) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatDateISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function BookingFlow({
  biositeId,
  primaryColor,
  services,
  staff,
  staffServices,
  availability,
}: {
  biositeId: string;
  primaryColor: string;
  services: Service[];
  staff: Staff[];
  staffServices: StaffService[];
  availability: Availability[];
}) {
  const supabase = createClient();

  const [service, setService] = useState<Service | null>(null);
  const [manualStaff, setManualStaff] = useState<Staff | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [occupied, setOccupied] = useState<OccupiedBlock[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligibleStaff = useMemo(() => {
    if (!service) return staff;
    const staffIds = new Set(staffServices.filter((s) => s.service_id === service.id).map((s) => s.staff_id));
    const filtered = staff.filter((s) => staffIds.has(s.id));
    return filtered.length > 0 ? filtered : staff;
  }, [service, staff, staffServices]);

  const activeStaff = manualStaff ?? (eligibleStaff.length === 1 ? eligibleStaff[0] : null);

  const servicesById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

  const getEffectiveDuration = useCallback(
    (staffId: string, serviceId: string) => {
      const override = staffServices.find((s) => s.staff_id === staffId && s.service_id === serviceId);
      return override?.duration_override ?? servicesById.get(serviceId)?.duration_minutes ?? 30;
    },
    [staffServices, servicesById]
  );

  // Each slot occupies the service's own duration (or the professional's
  // custom duration for that service, if set), so a 60min service offers
  // hourly starts and a 30min service offers half-hourly starts — no overlap.
  const slots = useMemo(() => {
    if (!date || !activeStaff || !service) return [];
    const duration = getEffectiveDuration(activeStaff.id, service.id);
    const weekday = date.getDay();
    const windows = availability.filter((a) => a.staff_id === activeStaff.id && a.weekday === weekday);
    const result: string[] = [];
    for (const w of windows) {
      let start = toTimeMinutes(w.start_time);
      const end = toTimeMinutes(w.end_time);
      while (start + duration <= end) {
        const overlaps = occupied.some((block) => start < block.end && start + duration > block.start);
        if (!overlaps) result.push(minutesToLabel(start));
        start += duration;
      }
    }
    return result;
  }, [date, activeStaff, service, availability, occupied, getEffectiveDuration]);

  const slotGroups = useMemo(() => {
    const groups = [
      { label: "Manhã", slots: [] as string[] },
      { label: "Tarde", slots: [] as string[] },
      { label: "Noite", slots: [] as string[] },
    ];
    for (const slot of slots) {
      const hour = parseInt(slot.slice(0, 2), 10);
      if (hour < 12) groups[0].slots.push(slot);
      else if (hour < 18) groups[1].slots.push(slot);
      else groups[2].slots.push(slot);
    }
    return groups.filter((g) => g.slots.length > 0);
  }, [slots]);

  async function selectDate(d: Date) {
    setDate(d);
    setTime(null);
    if (!activeStaff) return;
    const dateISO = formatDateISO(d);
    const [{ data: bookings }, { data: overrides }] = await Promise.all([
      supabase
        .from("bookings")
        .select("booking_time, service_id")
        .eq("biosite_id", biositeId)
        .eq("staff_id", activeStaff.id)
        .eq("booking_date", dateISO)
        .neq("status", "cancelled"),
      supabase
        .from("availability_overrides")
        .select("blocked_hours, full_day_blocked")
        .eq("staff_id", activeStaff.id)
        .eq("date", dateISO)
        .maybeSingle(),
    ]);
    const bookingBlocks = (bookings || []).map((b: { booking_time: string; service_id: string | null }) => {
      const start = toTimeMinutes(b.booking_time.slice(0, 5));
      const bookedDuration = b.service_id ? getEffectiveDuration(activeStaff.id, b.service_id) : 30;
      return { start, end: start + bookedDuration };
    });
    const blockedHourBlocks = (overrides?.blocked_hours || []).map((hour: number) => ({
      start: hour * 60,
      end: hour * 60 + 60,
    }));
    setOccupied([...bookingBlocks, ...blockedHourBlocks]);
  }

  async function confirmBooking() {
    if (!service || !date || !time || !name || !phone) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        biositeId,
        serviceId: service.id,
        staffId: activeStaff?.id ?? null,
        customerName: name,
        customerPhone: phone,
        notes: notes || null,
        bookingDate: formatDateISO(date),
        bookingTime: time,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError("Não foi possível confirmar. Tente outro horário.");
      return;
    }
    rememberBooking(biositeId, data.id);
    setDone(true);
  }

  function goBack() {
    if (time) {
      setTime(null);
    } else if (date) {
      setDate(null);
    } else if (manualStaff) {
      setManualStaff(null);
    } else if (service) {
      setService(null);
      setManualStaff(null);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-6 text-center shadow-sm">
        <div className="text-3xl">✅</div>
        <h2 className="text-lg font-semibold text-neutral-900">Agendamento confirmado!</h2>
        <p className="text-sm text-neutral-500">
          {service?.name} em {date && formatDateISO(date).split("-").reverse().join("/")} às {time}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {service && (
        <button
          onClick={goBack}
          className="flex items-center gap-1 self-start text-sm font-medium text-neutral-500 hover:text-neutral-800"
        >
          ← Voltar
        </button>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Escolha o serviço</h2>
        <div className="flex flex-col gap-2">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setService(s);
                setManualStaff(null);
                setDate(null);
                setTime(null);
              }}
              className="flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition"
              style={{
                borderColor: service?.id === s.id ? primaryColor : "#e5e5e5",
                backgroundColor: service?.id === s.id ? `${primaryColor}14` : "white",
              }}
            >
              <span>
                <span className="block font-medium text-neutral-900">{s.name}</span>
                <span className="text-neutral-500">
                  {s.duration_minutes} min{s.price ? ` · R$ ${s.price.toFixed(2)}` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {service && eligibleStaff.length >= 1 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">
            {eligibleStaff.length > 1 ? "Escolha o profissional" : "Profissional"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {eligibleStaff.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setManualStaff(s);
                  setDate(null);
                  setTime(null);
                }}
                className="rounded-full border px-4 py-2 text-sm"
                style={{
                  borderColor: activeStaff?.id === s.id ? primaryColor : "#e5e5e5",
                  backgroundColor: activeStaff?.id === s.id ? `${primaryColor}14` : "white",
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {service && activeStaff && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">Escolha o horário</h2>
          <div className="mb-3">
            <MonthCalendar selectedDate={date} onSelect={selectDate} primaryColor={primaryColor} />
          </div>

          {date && (
            <div className="flex flex-col gap-3">
              {slots.length === 0 && (
                <p className="text-sm text-neutral-400">Sem horários disponíveis nesse dia.</p>
              )}
              {slotGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 text-xs font-medium text-neutral-500">{group.label}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {group.slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setTime(slot)}
                        style={{
                          backgroundColor: time === slot ? primaryColor : "white",
                          color: time === slot ? "white" : "#333",
                          borderColor: time === slot ? primaryColor : "#e5e5e5",
                        }}
                        className="rounded-full border px-3 py-2 text-sm"
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {time && (
        <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm outline-none"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Seu telefone"
            className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm outline-none"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações (opcional)"
            className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm outline-none"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={confirmBooking}
            disabled={!name || !phone || submitting}
            style={{ backgroundColor: primaryColor }}
            className="rounded-full px-5 py-3 font-medium text-white shadow disabled:opacity-40"
          >
            {submitting ? "Confirmando..." : "Confirmar agendamento"}
          </button>
        </section>
      )}
    </div>
  );
}

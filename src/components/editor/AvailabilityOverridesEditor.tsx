"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MonthCalendar } from "@/components/ui/MonthCalendar";

type Override = {
  id: string;
  staff_id: string;
  date: string;
  blocked_hours: number[];
  full_day_blocked: boolean;
};

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 06:00 .. 21:00

function toDateISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

const WEEKDAY_FULL = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function AvailabilityOverridesEditor({
  staffId,
  overrides,
}: {
  staffId: string;
  overrides: Override[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const overridesByDate = useMemo(() => new Map(overrides.map((o) => [o.date, o])), [overrides]);
  const current = selectedDate ? overridesByDate.get(toDateISO(selectedDate)) : undefined;

  async function upsertOverride(date: Date, patch: Partial<Pick<Override, "blocked_hours" | "full_day_blocked">>) {
    const iso = toDateISO(date);
    const existing = overridesByDate.get(iso);
    await supabase.from("availability_overrides").upsert(
      {
        id: existing?.id,
        staff_id: staffId,
        date: iso,
        blocked_hours: existing?.blocked_hours || [],
        full_day_blocked: existing?.full_day_blocked || false,
        ...patch,
      },
      { onConflict: "staff_id,date" }
    );
    router.refresh();
  }

  function toggleHour(hour: number) {
    if (!selectedDate) return;
    const blocked = new Set(current?.blocked_hours || []);
    if (blocked.has(hour)) blocked.delete(hour);
    else blocked.add(hour);
    upsertOverride(selectedDate, { blocked_hours: Array.from(blocked), full_day_blocked: false });
  }

  function blockWholeDay() {
    if (!selectedDate) return;
    upsertOverride(selectedDate, { full_day_blocked: true, blocked_hours: HOURS });
  }

  function unblockWholeDay() {
    if (!selectedDate) return;
    upsertOverride(selectedDate, { full_day_blocked: false, blocked_hours: [] });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <MonthCalendar
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        primaryColor="#7c3aed"
        dayClassName={(date) => {
          const o = overridesByDate.get(toDateISO(date));
          if (!o) return undefined;
          if (o.full_day_blocked) return "line-through text-red-400";
          if (o.blocked_hours.length > 0) return "underline decoration-red-400";
          return undefined;
        }}
      />

      <div className="flex-1 rounded-xl border border-neutral-200 p-3">
        {!selectedDate ? (
          <p className="text-sm text-neutral-400">Selecione uma data no calendário.</p>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-900">
                {WEEKDAY_FULL[selectedDate.getDay()]}, {selectedDate.getDate()} de{" "}
                {selectedDate.toLocaleDateString("pt-BR", { month: "long" })}
              </span>
              <button
                onClick={current?.full_day_blocked ? unblockWholeDay : blockWholeDay}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 hover:border-red-300 hover:text-red-500"
              >
                {current?.full_day_blocked ? "Desbloquear o dia" : "Bloquear o dia inteiro"}
              </button>
            </div>
            <p className="mb-2 text-xs text-neutral-400">
              Ligue ou desligue cada horário deste dia. Verde = aberto, cinza = fechado.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {HOURS.map((hour) => {
                const blocked = current?.blocked_hours?.includes(hour);
                return (
                  <button
                    key={hour}
                    onClick={() => toggleHour(hour)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      blocked
                        ? "border-neutral-200 bg-neutral-100 text-neutral-400 line-through"
                        : "border-green-200 bg-green-50 text-green-700"
                    }`}
                  >
                    {String(hour).padStart(2, "0")}:00
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

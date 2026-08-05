"use client";

import { useState } from "react";

const WEEKDAY_LABELS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTH_LABELS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function toDateISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function MonthCalendar({
  selectedDate,
  onSelect,
  primaryColor,
  minDate,
  dayClassName,
}: {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  primaryColor: string;
  minDate?: Date;
  dayClassName?: (date: Date) => string | undefined;
}) {
  const [cursor, setCursor] = useState(() => {
    const base = selectedDate || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const min = minDate ? startOfDay(minDate) : startOfDay(new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  return (
    <div className="rounded-xl border border-neutral-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="px-2 text-neutral-400 hover:text-neutral-700"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-neutral-900">
          {MONTH_LABELS[month]} {year}
        </span>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="px-2 text-neutral-400 hover:text-neutral-700"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-400">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const disabled = date < min;
          const isSelected = selectedDate && toDateISO(date) === toDateISO(selectedDate);
          const extraClass = dayClassName?.(date);

          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onSelect(date)}
              className={`aspect-square rounded-full text-sm transition ${
                disabled ? "text-neutral-300" : "text-neutral-700 hover:bg-neutral-100"
              } ${extraClass || ""}`}
              style={
                isSelected
                  ? { backgroundColor: primaryColor, color: "#fff" }
                  : undefined
              }
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Service, Staff } from "@/lib/types";

type Availability = { id: string; staff_id: string; weekday: number; start_time: string; end_time: string };
type StaffService = { staff_id: string; service_id: string };

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function StaffRow({
  member,
  services,
  assignedServiceIds,
  availability,
}: {
  member: Staff;
  services: Service[];
  assignedServiceIds: Set<string>;
  availability: Availability[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [weekday, setWeekday] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");

  async function toggleService(serviceId: string, checked: boolean) {
    if (checked) {
      await supabase.from("staff_services").insert({ staff_id: member.id, service_id: serviceId });
    } else {
      await supabase
        .from("staff_services")
        .delete()
        .eq("staff_id", member.id)
        .eq("service_id", serviceId);
    }
    router.refresh();
  }

  async function addAvailability() {
    await supabase.from("availability").insert({
      staff_id: member.id,
      weekday: parseInt(weekday),
      start_time: start,
      end_time: end,
    });
    router.refresh();
  }

  async function removeAvailability(id: string) {
    await supabase.from("availability").delete().eq("id", id);
    router.refresh();
  }

  async function removeStaff() {
    await supabase.from("staff").delete().eq("id", member.id);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white text-neutral-900 p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-neutral-900">{member.name}</span>
        <button onClick={removeStaff} className="text-sm text-red-500">
          excluir
        </button>
      </div>

      {services.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {services.map((s) => (
            <label key={s.id} className="flex items-center gap-1.5 text-xs text-neutral-600">
              <input
                type="checkbox"
                checked={assignedServiceIds.has(s.id)}
                onChange={(e) => toggleService(s.id, e.target.checked)}
              />
              {s.name}
            </label>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1">
        {availability.map((a) => (
          <div key={a.id} className="flex items-center gap-2 text-xs text-neutral-600">
            <span className="flex-1">
              {WEEKDAYS[a.weekday]}: {a.start_time.slice(0, 5)} às {a.end_time.slice(0, 5)}
            </span>
            <button onClick={() => removeAvailability(a.id)} className="text-red-500">
              remover
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={weekday}
          onChange={(e) => setWeekday(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-2 py-1 text-xs"
        >
          {WEEKDAYS.map((d, i) => (
            <option key={i} value={i}>
              {d}
            </option>
          ))}
        </select>
        <input
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-2 py-1 text-xs"
        />
        <span className="text-xs text-neutral-400">até</span>
        <input
          type="time"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white text-neutral-900 px-2 py-1 text-xs"
        />
        <button
          onClick={addAvailability}
          className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-medium text-white"
        >
          + horário
        </button>
      </div>
    </div>
  );
}

export function StaffEditor({
  biositeId,
  staff,
  services,
  staffServices,
  availability,
}: {
  biositeId: string;
  staff: Staff[];
  services: Service[];
  staffServices: StaffService[];
  availability: Availability[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function addStaff() {
    if (!name) return;
    setSaving(true);
    await supabase.from("staff").insert({ biosite_id: biositeId, name });
    setSaving(false);
    setName("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {staff.map((member) => (
        <StaffRow
          key={member.id}
          member={member}
          services={services}
          assignedServiceIds={
            new Set(staffServices.filter((s) => s.staff_id === member.id).map((s) => s.service_id))
          }
          availability={availability.filter((a) => a.staff_id === member.id)}
        />
      ))}

      <div className="flex gap-2 rounded-lg border border-neutral-200 bg-white text-neutral-900 p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do profissional"
          className="flex-1 rounded-lg border border-neutral-200 bg-white text-neutral-900 px-3 py-2 text-sm"
        />
        <button
          onClick={addStaff}
          disabled={saving || !name}
          className="rounded-full bg-pink-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

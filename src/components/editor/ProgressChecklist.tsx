"use client";

type ChecklistItem = {
  label: string;
  done: boolean;
};

export function ProgressChecklist({ items }: { items: ChecklistItem[] }) {
  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const percent = Math.round((done / total) * 100);

  return (
    <section className="mb-6 flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="flex shrink-0 items-center gap-3">
        <div
          className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-neutral-900"
          style={{
            background: `conic-gradient(#1e3a8a ${percent}%, #e5e5e5 0)`,
          }}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white">{percent}%</div>
        </div>
        <div className="sm:hidden">
          <p className="text-sm font-semibold text-neutral-900">
            Sua lista de configuração — {done}/{total}
          </p>
          <p className="text-xs text-neutral-500">Complete pra deixar o biosite pronto pra receber visitas.</p>
        </div>
      </div>

      <div className="hidden sm:block">
        <p className="text-sm font-semibold text-neutral-900">
          Sua lista de configuração — {done}/{total}
        </p>
        <p className="text-xs text-neutral-500">Complete pra deixar o biosite pronto pra receber visitas.</p>
      </div>

      <ul className="grid flex-1 grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.label}
            className={`flex items-center gap-2 text-sm ${
              item.done ? "text-neutral-400 line-through" : "text-neutral-700"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                item.done ? "border-blue-900 bg-blue-900 text-white" : "border-neutral-300"
              }`}
            >
              {item.done ? "✓" : ""}
            </span>
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

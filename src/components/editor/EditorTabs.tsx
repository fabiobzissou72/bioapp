"use client";

import { useState, type ReactNode } from "react";

export type EditorTab = {
  id: string;
  label: string;
  content: ReactNode;
};

export function EditorTabs({ tabs }: { tabs: EditorTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur">
        <div className="flex gap-1 overflow-x-auto whitespace-nowrap py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                active === tab.id
                  ? "bg-pink-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {tabs.map((tab) => (
        // Every tab stays mounted (just hidden) so switching tabs never resets a form's local state.
        <div key={tab.id} className={active === tab.id ? "block" : "hidden"}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}

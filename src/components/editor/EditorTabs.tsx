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
    <div className="lg:flex lg:items-start lg:gap-6">
      <nav className="sticky top-0 z-10 -mx-4 mb-6 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur lg:static lg:mx-0 lg:mb-0 lg:w-48 lg:shrink-0 lg:border-b-0 lg:border-r lg:border-neutral-200 lg:bg-transparent lg:px-0 lg:pr-4 lg:pt-1 lg:backdrop-blur-none">
        <div className="flex gap-1 overflow-x-auto whitespace-nowrap py-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:py-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-left text-sm font-semibold transition lg:rounded-lg lg:px-3 ${
                active === tab.id
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="min-w-0 flex-1">
        {tabs.map((tab) => (
          // Every tab stays mounted (just hidden) so switching tabs never resets a form's local state.
          <div key={tab.id} className={active === tab.id ? "block" : "hidden"}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}

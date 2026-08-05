"use client";

import { createClient } from "@/lib/supabase/client";
import type { BiositeButton } from "@/lib/types";

const BADGES: Record<string, { background: string; node: React.ReactNode }> = {
  instagram: {
    background: "linear-gradient(45deg, #405DE6, #C13584, #F56040, #FFDC80)",
    node: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="white" stroke="none" />
      </svg>
    ),
  },
  facebook: {
    background: "#1877F2",
    node: <span className="font-serif text-lg font-bold text-white">f</span>,
  },
  x_twitter: {
    background: "#000000",
    node: <span className="text-base font-bold text-white">𝕏</span>,
  },
  youtube: {
    background: "#FF0000",
    node: (
      <svg width="20" height="20" viewBox="0 0 24 24">
        <polygon points="9,7 17,12 9,17" fill="white" />
      </svg>
    ),
  },
  linkedin: {
    background: "#0A66C2",
    node: <span className="text-xs font-bold text-white">in</span>,
  },
  pinterest: {
    background: "#E60023",
    node: <span className="font-serif text-lg font-bold text-white">P</span>,
  },
  tiktok: {
    background: "#000000",
    node: <span className="text-base text-white">♪</span>,
  },
  threads: { background: "#000000", node: <span className="text-base">🧵</span> },
  snapchat: { background: "#FFFC00", node: <span className="text-base">👻</span> },
  twitch: { background: "#9146FF", node: <span className="text-base">🎮</span> },
  telegram: { background: "#229ED9", node: <span className="text-base">✈️</span> },
  spotify: { background: "#1DB954", node: <span className="text-base">🎧</span> },
};

export function SocialIconRow({ biositeId, buttons }: { biositeId: string; buttons: BiositeButton[] }) {
  const supabase = createClient();
  if (buttons.length === 0) return null;

  function trackClick(buttonId: string) {
    supabase
      .from("clicks")
      .insert({
        biosite_id: biositeId,
        button_id: buttonId,
        device: /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop",
        source: document.referrer || "direct",
      })
      .then(() => {});
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-3">
      {buttons.map((button) => {
        const badge = BADGES[button.type];
        if (!badge || !button.url) return null;
        return (
          <a
            key={button.id}
            href={button.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick(button.id)}
            aria-label={button.label || button.type}
            className="flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition active:scale-95"
            style={{ background: badge.background }}
          >
            {badge.node}
          </a>
        );
      })}
    </div>
  );
}

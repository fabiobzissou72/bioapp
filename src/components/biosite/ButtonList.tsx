"use client";

import { createClient } from "@/lib/supabase/client";
import { getContrastTextColor } from "@/lib/color";
import type { BiositeButton } from "@/lib/types";
import { PixButton } from "./PixButton";
import { WifiButton } from "./WifiButton";

const ICONS: Record<string, string> = {
  instagram: "📷",
  whatsapp: "💬",
  google_review: "⭐",
  address: "📍",
  booking: "📅",
  custom: "🔗",
};

const LABELS: Record<string, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  google_review: "Avaliar no Google",
  address: "Como chegar",
  booking: "Agende aqui",
  custom: "Link",
};

function resolveHref(button: BiositeButton, slug: string) {
  if (button.type === "whatsapp" && button.url) {
    const digits = button.url.replace(/\D/g, "");
    const msg = button.config.message ? `?text=${encodeURIComponent(button.config.message)}` : "";
    return `https://wa.me/${digits}${msg}`;
  }
  if (button.type === "address" && button.config.full_address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      button.config.full_address
    )}`;
  }
  if (button.type === "booking") {
    return `/${slug}/agendar`;
  }
  return button.url || "#";
}

export function ButtonList({
  biositeId,
  slug,
  buttons,
  merchantName,
  primaryColor,
  buttonTextColor,
}: {
  biositeId: string;
  slug: string;
  buttons: BiositeButton[];
  merchantName: string;
  primaryColor: string;
  buttonTextColor: string | null;
}) {
  const supabase = createClient();

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
    <div className="flex w-full flex-col gap-3">
      {buttons.map((button) => {
        const backgroundColor = button.color || primaryColor;
        const style: React.CSSProperties = {
          backgroundColor,
          color: buttonTextColor || getContrastTextColor(backgroundColor),
          animation: button.pulse ? "pulse 2s infinite" : undefined,
        };

        if (button.type === "pix") {
          return <PixButton key={button.id} button={button} merchantName={merchantName} style={style} />;
        }

        if (button.type === "wifi") {
          return <WifiButton key={button.id} button={button} style={style} />;
        }

        const href = resolveHref(button, slug);
        const label = button.label || LABELS[button.type] || "Link";
        const icon = ICONS[button.type] || "🔗";
        const isInternal = button.type === "booking";

        return (
          <a
            key={button.id}
            href={href}
            target={isInternal ? undefined : "_blank"}
            rel={isInternal ? undefined : "noopener noreferrer"}
            onClick={() => trackClick(button.id)}
            style={style}
            className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-center font-medium shadow transition active:scale-[0.98]"
          >
            {button.style !== "icon" && <span>{icon}</span>}
            <span>{label}</span>
          </a>
        );
      })}
    </div>
  );
}

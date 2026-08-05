import { getContrastTextColor } from "@/lib/color";
import type { BiositeButton } from "@/lib/types";

export function AddressBlock({ button }: { button: BiositeButton }) {
  const { full_address, address_lat, address_lng, address_block_bg, address_block_text } = button.config;
  if (!full_address) return null;

  const blockBg = address_block_bg || "#ffffff";
  const blockText = address_block_text || getContrastTextColor(blockBg);
  const buttonBg = button.color || "#ec4899";
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(full_address)}`;

  const hasCoords = typeof address_lat === "number" && typeof address_lng === "number";
  const delta = 0.006;
  const bbox = hasCoords
    ? `${address_lng! - delta},${address_lat! - delta},${address_lng! + delta},${address_lat! + delta}`
    : null;

  return (
    <div className="w-full overflow-hidden rounded-2xl shadow-sm" style={{ backgroundColor: blockBg }}>
      {hasCoords && (
        <iframe
          title="Mapa"
          className="h-40 w-full border-0"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${address_lat},${address_lng}`}
        />
      )}
      <div className="p-4">
        <p className="text-sm" style={{ color: blockText }}>
          {full_address}
        </p>
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: buttonBg, color: getContrastTextColor(buttonBg) }}
          className="mt-3 inline-block rounded-full px-4 py-2 text-sm font-medium"
        >
          {button.label || "Como chegar"}
        </a>
      </div>
    </div>
  );
}

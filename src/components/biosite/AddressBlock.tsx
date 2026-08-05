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
        // The OSM embed always includes a bottom strip (report-a-problem/donate/
        // terms links) baked into the iframe itself, with no URL param to hide
        // it. We crop it off visually (container shorter than the iframe) and
        // show only the license-required attribution ourselves, smaller.
        <div className="relative h-40 w-full overflow-hidden bg-neutral-100">
          <iframe
            title="Mapa"
            className="absolute inset-x-0 top-0 w-full border-0"
            style={{ height: "calc(100% + 42px)" }}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${address_lat},${address_lng}`}
          />
          <span className="absolute bottom-1 right-1 rounded bg-white/80 px-1 text-[9px] text-neutral-600">
            © OpenStreetMap
          </span>
        </div>
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

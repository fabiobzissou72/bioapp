"use client";

import { useEffect, useState } from "react";
import { getContrastTextColor } from "@/lib/color";
import type { CatalogGroup, CatalogItem } from "@/lib/types";

const ASPECT_CLASS: Record<CatalogItem["aspect"], string> = {
  square: "aspect-square",
  horizontal: "aspect-video",
  vertical: "aspect-[9/16]",
  original: "",
};

function ItemCard({ item, primaryColor, dark }: { item: CatalogItem; primaryColor: string; dark: boolean }) {
  return (
    <div
      className={`w-full overflow-hidden rounded-2xl border shadow-sm ${
        dark ? "border-neutral-800 bg-neutral-900" : "border-neutral-100 bg-white"
      }`}
    >
      {item.media_url && (
        <div className={`relative w-full overflow-hidden bg-neutral-100 ${ASPECT_CLASS[item.aspect]}`}>
          {item.media_type === "video" ? (
            <video
              src={item.media_url}
              className={`h-full w-full ${item.object_fit === "contain" ? "object-contain" : "object-cover"}`}
              muted
              loop
              playsInline
              autoPlay
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.media_url}
              alt={item.title || ""}
              className={`h-full w-full ${item.object_fit === "contain" ? "object-contain" : "object-cover"}`}
            />
          )}
          {item.media_type === "video" && (
            <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white">
              ▶ vídeo
            </span>
          )}
          <span
            className="absolute left-2 top-2 rounded-full px-2 py-1 text-xs font-medium"
            style={{ backgroundColor: primaryColor, color: getContrastTextColor(primaryColor) }}
          >
            {item.item_type === "service" ? "Serviço" : "Produto"}
          </span>
        </div>
      )}
      <div className="p-4" style={{ textAlign: item.cta_align }}>
        {item.title && (
          <h4 className={`font-semibold ${dark ? "text-neutral-50" : "text-neutral-900"}`}>{item.title}</h4>
        )}
        {item.description && (
          <p className={`mt-1 text-sm ${dark ? "text-neutral-400" : "text-neutral-500"}`}>{item.description}</p>
        )}
        {item.cta_label && item.cta_url && (
          <a
            href={item.cta_url}
            target={item.cta_url.startsWith("/") ? undefined : "_blank"}
            rel={item.cta_url.startsWith("/") ? undefined : "noopener noreferrer"}
            style={{ backgroundColor: primaryColor, color: getContrastTextColor(primaryColor) }}
            className="mt-3 inline-block rounded-full px-4 py-2 text-sm font-medium"
          >
            {item.cta_label}
          </a>
        )}
      </div>
    </div>
  );
}

function Lightbox({
  item,
  primaryColor,
  dark,
  onClose,
}: {
  item: CatalogItem;
  primaryColor: string;
  dark: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="mb-2 ml-auto block text-sm font-medium text-white">
          Fechar ✕
        </button>
        <ItemCard item={item} primaryColor={primaryColor} dark={dark} />
      </div>
    </div>
  );
}

function GridGroup({
  items,
  primaryColor,
  dark,
}: {
  items: CatalogItem[];
  primaryColor: string;
  dark: boolean;
}) {
  const [selected, setSelected] = useState<CatalogItem | null>(null);

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelected(item)}
            className="relative aspect-square w-[31%] overflow-hidden rounded-lg bg-neutral-100"
          >
            {item.media_url &&
              (item.media_type === "video" ? (
                <video src={item.media_url} className="h-full w-full object-cover" muted playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.media_url} alt={item.title || ""} className="h-full w-full object-cover" />
              ))}
            {item.media_type === "video" && (
              <span className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                ▶
              </span>
            )}
            <span
              className="absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: primaryColor, color: getContrastTextColor(primaryColor) }}
            >
              {item.item_type === "service" ? "Serviço" : "Produto"}
            </span>
          </button>
        ))}
      </div>
      {selected && (
        <Lightbox item={selected} primaryColor={primaryColor} dark={dark} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function CarouselGroup({
  items,
  intervalSeconds,
  primaryColor,
  dark,
}: {
  items: CatalogItem[];
  intervalSeconds: number;
  primaryColor: string;
  dark: boolean;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, Math.max(intervalSeconds, 1) * 1000);
    return () => clearInterval(timer);
  }, [items.length, intervalSeconds]);

  if (items.length === 0) return null;

  return (
    <div>
      <ItemCard item={items[index]} primaryColor={primaryColor} dark={dark} />
      {items.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {items.map((item, i) => (
            <span
              key={item.id}
              className="h-1.5 w-1.5 rounded-full transition"
              style={{ backgroundColor: i === index ? primaryColor : "#d4d4d4" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CatalogSection({
  groups,
  itemsByGroup,
  primaryColor,
  dark = false,
}: {
  groups: CatalogGroup[];
  itemsByGroup: Record<string, CatalogItem[]>;
  primaryColor: string;
  dark?: boolean;
}) {
  if (groups.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-4">
      {groups.map((group) => {
        if (!group.enabled) return null;
        const items = itemsByGroup[group.id] || [];
        if (items.length === 0) return null;

        if (group.layout === "carousel") {
          return (
            <CarouselGroup
              key={group.id}
              items={items}
              intervalSeconds={group.interval_seconds}
              primaryColor={primaryColor}
              dark={dark}
            />
          );
        }

        if (group.layout === "grid") {
          return <GridGroup key={group.id} items={items} primaryColor={primaryColor} dark={dark} />;
        }

        return (
          <div key={group.id} className="flex flex-col gap-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} primaryColor={primaryColor} dark={dark} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

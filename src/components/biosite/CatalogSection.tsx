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

function ItemCard({ item, primaryColor }: { item: CatalogItem; primaryColor: string }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
      {item.media_url && (
        <div className={`w-full overflow-hidden bg-neutral-100 ${ASPECT_CLASS[item.aspect]}`}>
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
        </div>
      )}
      <div className="p-4" style={{ textAlign: item.cta_align }}>
        {item.title && <h4 className="font-semibold text-neutral-900">{item.title}</h4>}
        {item.description && <p className="mt-1 text-sm text-neutral-500">{item.description}</p>}
        {item.cta_label && item.cta_url && (
          <a
            href={item.cta_url}
            target="_blank"
            rel="noopener noreferrer"
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

function CarouselGroup({
  items,
  intervalSeconds,
  primaryColor,
}: {
  items: CatalogItem[];
  intervalSeconds: number;
  primaryColor: string;
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
      <ItemCard item={items[index]} primaryColor={primaryColor} />
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
}: {
  groups: CatalogGroup[];
  itemsByGroup: Record<string, CatalogItem[]>;
  primaryColor: string;
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
            />
          );
        }

        return (
          <div key={group.id} className="flex flex-col gap-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} primaryColor={primaryColor} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

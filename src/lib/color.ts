// Picks black or white text based on the background color's luminance (WCAG-ish heuristic).
export function getContrastTextColor(hex: string | null | undefined) {
  if (!hex) return "#ffffff";
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#ffffff";

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111111" : "#ffffff";
}

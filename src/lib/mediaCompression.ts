const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY = 0.82;
export const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

// Animated formats would lose their animation if flattened to WebP.
const SKIP_COMPRESSION_TYPES = new Set(["image/gif", "image/svg+xml"]);

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || SKIP_COMPRESSION_TYPES.has(file.type)) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", IMAGE_QUALITY)
  );
  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], newName, { type: "image/webp" });
}

export function assertVideoSizeOk(file: File) {
  if (file.type.startsWith("video/") && file.size > MAX_VIDEO_BYTES) {
    const sizeMb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(
      `Vídeo muito grande (${sizeMb} MB, limite é 20 MB). Comprima o vídeo antes de enviar.`
    );
  }
}

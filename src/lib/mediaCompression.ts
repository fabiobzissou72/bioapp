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

// In-app browsers (Instagram/Facebook's built-in webview, notably) often
// refuse to decode/preload video before user interaction, leaving grid
// thumbnails blank. A poster image is a plain <img>-like attribute that
// always renders regardless of the browser's video-loading policy.
export async function generateVideoPoster(file: File): Promise<Blob | null> {
  if (!file.type.startsWith("video/")) return null;

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    let settled = false;
    function finish(blob: Blob | null) {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(objectUrl);
      resolve(blob);
    }

    video.addEventListener("loadeddata", () => {
      video.currentTime = Math.min(0.1, video.duration || 0);
    });

    video.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx || canvas.width === 0) {
        finish(null);
        return;
      }
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => finish(blob), "image/jpeg", 0.8);
    });

    video.addEventListener("error", () => finish(null));
    setTimeout(() => finish(null), 8000);
  });
}

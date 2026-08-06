import { createClient } from "@/lib/supabase/client";
import { compressImage, assertVideoSizeOk, generateVideoPoster } from "@/lib/mediaCompression";

async function uploadFile(file: File, userId: string, folder: string, suffix = "") {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${userId}/${folder}/${crypto.randomUUID()}${suffix}.${ext}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

export async function uploadMedia(
  file: File,
  userId: string,
  folder: string
): Promise<{ url: string; posterUrl: string | null }> {
  assertVideoSizeOk(file);

  let posterUrl: string | null = null;
  if (file.type.startsWith("video/")) {
    const posterBlob = await generateVideoPoster(file);
    if (posterBlob) {
      posterUrl = await uploadFile(new File([posterBlob], "poster.jpg", { type: "image/jpeg" }), userId, folder, "-poster");
    }
  }

  const compressed = await compressImage(file);
  const url = await uploadFile(compressed, userId, folder);
  return { url, posterUrl };
}

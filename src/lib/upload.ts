import { createClient } from "@/lib/supabase/client";
import { compressImage, assertVideoSizeOk } from "@/lib/mediaCompression";

export async function uploadMedia(file: File, userId: string, folder: string) {
  const supabase = createClient();

  assertVideoSizeOk(file);
  const uploadFile = await compressImage(file);

  const ext = uploadFile.name.split(".").pop();
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(path, uploadFile, { upsert: true, contentType: uploadFile.type });
  if (error) throw error;

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

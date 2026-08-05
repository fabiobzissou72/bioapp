import { createClient } from "@/lib/supabase/client";

export async function uploadMedia(file: File, userId: string, folder: string) {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

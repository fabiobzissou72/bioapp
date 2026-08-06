import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Defense-in-depth cap — the client already compresses images and rejects
// oversized videos before sending, but this route is unauthenticated
// (anonymous briefing submitters), so it enforces its own ceiling too.
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const ownerId = process.env.BRIEFING_OWNER_ID;
  if (!ownerId) {
    return NextResponse.json({ error: "Formulário não configurado." }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande." }, { status: 400 });
  }

  const admin = createAdminClient();
  const ext = file.name.split(".").pop() || "bin";
  const path = `${ownerId}/briefing/${crypto.randomUUID()}.${ext}`;

  const { error } = await admin.storage
    .from("media")
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data } = admin.storage.from("media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}

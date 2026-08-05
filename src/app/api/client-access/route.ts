import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { biositeId, email, password } = await request.json();
  if (!biositeId || !email || !password) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: biosite } = await supabase
    .from("biosites")
    .select("id")
    .eq("id", biositeId)
    .eq("owner_id", user.id)
    .single();
  if (!biosite) return NextResponse.json({ error: "Biosite não encontrado." }, { status: 404 });

  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) {
    const alreadyExists = createError.message.toLowerCase().includes("already");
    return NextResponse.json(
      {
        error: alreadyExists
          ? "Esse e-mail já tem uma conta de cliente em outro biosite (não suportado por enquanto)."
          : createError.message,
      },
      { status: 400 }
    );
  }

  const { error: accessError } = await admin
    .from("client_access")
    .upsert({ biosite_id: biositeId, email }, { onConflict: "biosite_id,email" });
  if (accessError) {
    return NextResponse.json({ error: accessError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { biositeId, email } = await request.json();
  if (!biositeId || !email) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: biosite } = await supabase
    .from("biosites")
    .select("id")
    .eq("id", biositeId)
    .eq("owner_id", user.id)
    .single();
  if (!biosite) return NextResponse.json({ error: "Biosite não encontrado." }, { status: 404 });

  const admin = createAdminClient();
  await admin.from("client_access").delete().eq("biosite_id", biositeId).eq("email", email);

  return NextResponse.json({ ok: true });
}

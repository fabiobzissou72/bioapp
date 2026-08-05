import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

type IncomingProfile = {
  handle: string;
  fullName?: string;
  bioText?: string;
  profileUrl?: string;
  hasLinkInBio?: boolean;
};

async function getUserFromRequest(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function classifyWithGroq(niche: string, city: string, profile: IncomingProfile) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "Você analisa perfis de Instagram de profissionais/negócios locais para uma agência que vende " +
            '"biosites" (uma página de link na bio profissional, com agendamento, Pix, catálogo de serviços) ' +
            "para quem ainda não tem algo assim. Um bom alvo comercial é um perfil SEM link organizado na bio, " +
            "ou com bio vazia/fraca, ou só com número de WhatsApp solto — ou seja, alguém que claramente " +
            "precisaria de um biosite. Perfis que já têm um link-in-bio bem feito (Linktree, site próprio, etc) " +
            "são maus alvos. Responda SOMENTE em JSON válido no formato: " +
            '{"is_target": boolean, "reasoning": "motivo curto em português", "approach": ' +
            '"mensagem curta e natural em português pra mandar no direct do Instagram, mencionando algo ' +
            'específico do perfil, sem parecer spam, sem emojis em excesso"}',
        },
        {
          role: "user",
          content: JSON.stringify({
            nicho: niche,
            cidade: city,
            nome: profile.fullName || profile.handle,
            usuario: profile.handle,
            bio: profile.bioText || "(sem bio)",
            tem_link_na_bio: !!profile.hasLinkInBio,
          }),
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  return JSON.parse(content) as { is_target: boolean; reasoning: string; approach: string };
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { niche, city, profiles } = (await request.json()) as {
    niche: string;
    city: string;
    profiles: IncomingProfile[];
  };
  if (!Array.isArray(profiles) || profiles.length === 0) {
    return NextResponse.json({ error: "Nenhum perfil enviado." }, { status: 400 });
  }

  const admin = createAdminClient();
  const results = [];

  for (const profile of profiles.slice(0, 10)) {
    if (!profile.handle) continue;
    try {
      const classification = await classifyWithGroq(niche, city, profile);
      const { data: saved, error } = await admin
        .from("leads")
        .upsert(
          {
            owner_id: user.id,
            niche,
            city,
            instagram_handle: profile.handle,
            profile_url: profile.profileUrl || `https://instagram.com/${profile.handle}`,
            full_name: profile.fullName || null,
            bio_text: profile.bioText || null,
            has_link_in_bio: !!profile.hasLinkInBio,
            is_target: classification.is_target,
            ai_reasoning: classification.reasoning,
            suggested_approach: classification.approach,
          },
          { onConflict: "owner_id,instagram_handle" }
        )
        .select()
        .single();
      if (error) throw error;
      results.push(saved);
    } catch (err) {
      results.push({ instagram_handle: profile.handle, error: (err as Error).message });
    }
  }

  return NextResponse.json({ results });
}

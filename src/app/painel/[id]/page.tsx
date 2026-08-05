import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BiositeInfoForm } from "@/components/editor/BiositeInfoForm";
import { ButtonsEditor } from "@/components/editor/ButtonsEditor";
import { ServicesEditor } from "@/components/editor/ServicesEditor";
import { StaffEditor } from "@/components/editor/StaffEditor";
import type { BiositeButton, Service, Staff } from "@/lib/types";

export const revalidate = 0;

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: biosite } = await supabase.from("biosites").select("*").eq("id", id).single();
  if (!biosite) notFound();

  const [{ data: buttons }, { data: services }, { data: staff }, { data: staffServices }] =
    await Promise.all([
      supabase.from("buttons").select("*").eq("biosite_id", id).order("position"),
      supabase.from("services").select("*").eq("biosite_id", id).order("created_at"),
      supabase.from("staff").select("*").eq("biosite_id", id).order("created_at"),
      supabase.from("staff_services").select("staff_id, service_id"),
    ]);

  const staffIds = (staff || []).map((s: Staff) => s.id);
  const { data: availability } = staffIds.length
    ? await supabase.from("availability").select("*").in("staff_id", staffIds)
    : { data: [] };

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-16 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/painel" className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Voltar
        </Link>
        <a
          href={`/${biosite.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-pink-600"
        >
          Ver biosite →
        </a>
      </div>

      <BiositeInfoForm biosite={biosite} />

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">Botões</h2>
        <ButtonsEditor biositeId={id} buttons={(buttons || []) as BiositeButton[]} slug={biosite.slug} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">Serviços (agendamento)</h2>
        <ServicesEditor biositeId={id} services={(services || []) as Service[]} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">Profissionais e disponibilidade</h2>
        <StaffEditor
          biositeId={id}
          staff={(staff || []) as Staff[]}
          services={(services || []) as Service[]}
          staffServices={staffServices || []}
          availability={availability || []}
        />
      </section>
    </main>
  );
}

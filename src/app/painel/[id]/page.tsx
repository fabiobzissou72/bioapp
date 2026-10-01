import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BiositeInfoForm } from "@/components/editor/BiositeInfoForm";
import { AparenciaEditor } from "@/components/editor/AparenciaEditor";
import { BusinessHoursEditor } from "@/components/editor/BusinessHoursEditor";
import { HighlightCardsEditor } from "@/components/editor/HighlightCardsEditor";
import { ProgressChecklist } from "@/components/editor/ProgressChecklist";
import { EditorTabs } from "@/components/editor/EditorTabs";
import { PreviewPhone } from "@/components/editor/PreviewPhone";
import { LivePreviewPanel } from "@/components/editor/LivePreviewPanel";
import { ButtonsEditor } from "@/components/editor/ButtonsEditor";
import { ServicesEditor } from "@/components/editor/ServicesEditor";
import { StaffEditor } from "@/components/editor/StaffEditor";
import { CatalogEditor } from "@/components/editor/CatalogEditor";
import { QrCodeButton } from "@/components/editor/QrCodeButton";
import { SeoEditor } from "@/components/editor/SeoEditor";
import { ClientAccessEditor } from "@/components/editor/ClientAccessEditor";
import { NotificationWebhookEditor } from "@/components/editor/NotificationWebhookEditor";
import type { BiositeButton, CatalogGroup, CatalogItem, Service, Staff } from "@/lib/types";

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
      supabase.from("staff_services").select("staff_id, service_id, price_override, duration_override"),
    ]);

  const staffIds = (staff || []).map((s: Staff) => s.id);
  const [{ data: availability }, { data: overrides }] = staffIds.length
    ? await Promise.all([
        supabase.from("availability").select("*").in("staff_id", staffIds),
        supabase.from("availability_overrides").select("*").in("staff_id", staffIds),
      ])
    : [{ data: [] }, { data: [] }];

  const { data: clientAccesses } = await supabase
    .from("client_access")
    .select("email")
    .eq("biosite_id", id);

  const { data: catalogGroups } = await supabase
    .from("catalog_groups")
    .select("*")
    .eq("biosite_id", id)
    .order("position");

  const groupIds = (catalogGroups || []).map((g: CatalogGroup) => g.id);
  const { data: catalogItems } = groupIds.length
    ? await supabase.from("catalog_items").select("*").in("group_id", groupIds).order("position")
    : { data: [] as CatalogItem[] };

  const itemsByGroup: Record<string, CatalogItem[]> = {};
  for (const item of catalogItems || []) {
    (itemsByGroup[item.group_id] ||= []).push(item);
  }

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const publicUrl = `${protocol}://${host}/${biosite.slug}`;

  return (
    <main className="min-h-screen w-full bg-[#faf9f5] px-4 pb-16 pt-6">
      <div className="mx-auto w-full max-w-[1800px]">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/painel" className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Voltar
        </Link>
        <div className="flex items-center gap-4">
          <Link href={`/painel/${id}/estatisticas`} className="text-sm font-medium text-neutral-600">
            Estatísticas
          </Link>
          <QrCodeButton url={publicUrl} />
          <a
            href={`/${biosite.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#191970] lg:hidden"
          >
            Ver biosite →
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
        <div className="mb-6 flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#191970]">Bio Insta editor</p>
            <h1 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl">Editar biosite</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Tudo editável com preview ao vivo. Depois é só compartilhar o link ou o QR Code.
            </p>
          </div>
          <a
            href={`/${biosite.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden shrink-0 rounded-full bg-[#191970] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#12124f] lg:inline-block"
          >
            Ver biosite →
          </a>
        </div>

        <div className="lg:flex lg:items-start lg:gap-6">
          <div className="min-w-0 flex-1">
            <ProgressChecklist
              items={[
                { label: "Nome do negócio", done: Boolean(biosite.business_name?.trim()) },
                { label: "Descrição", done: Boolean(biosite.description?.trim()) },
                { label: "Foto de perfil ou logo", done: Boolean(biosite.logo_url) },
                { label: "Pelo menos 1 botão ativo", done: (buttons || []).length > 0 },
                { label: "Biosite publicado", done: biosite.published },
              ]}
            />

            <EditorTabs
              tabs={[
                {
                  id: "perfil",
                  label: "Perfil e Contato",
                  icon: "👤",
                  content: (
                    <div className="flex flex-col gap-8">
                      <BiositeInfoForm biosite={biosite} />
                      <BusinessHoursEditor biosite={biosite} />
                      <HighlightCardsEditor biosite={biosite} />
                      <section>
                        <h2 className="mb-3 text-lg font-semibold text-neutral-900">SEO (Google)</h2>
                        <SeoEditor biosite={biosite} />
                      </section>
                    </div>
                  ),
                },
                {
                  id: "botoes",
                  label: "Links e Botões",
                  icon: "🔗",
                  content: (
                    <ButtonsEditor
                      biositeId={id}
                      buttons={(buttons || []) as BiositeButton[]}
                      slug={biosite.slug}
                    />
                  ),
                },
                {
                  id: "catalogo",
                  label: "Catálogo",
                  icon: "🛍️",
                  content: (
                    <CatalogEditor
                      biositeId={id}
                      ownerId={biosite.owner_id}
                      groups={(catalogGroups || []) as CatalogGroup[]}
                      itemsByGroup={itemsByGroup}
                    />
                  ),
                },
                {
                  id: "servicos",
                  label: "Serviços",
                  icon: "📅",
                  group: "Agenda",
                  content: (
                    <div className="flex flex-col gap-8">
                      <section>
                        <h2 className="mb-3 text-lg font-semibold text-neutral-900">Serviços (agendamento)</h2>
                        <ServicesEditor biositeId={id} services={(services || []) as Service[]} />
                      </section>
                      <section>
                        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
                          Profissionais e disponibilidade
                        </h2>
                        <StaffEditor
                          biositeId={id}
                          staff={(staff || []) as Staff[]}
                          services={(services || []) as Service[]}
                          staffServices={staffServices || []}
                          availability={availability || []}
                          overrides={overrides || []}
                        />
                      </section>
                    </div>
                  ),
                },
                {
                  id: "aparencia",
                  label: "Aparência",
                  icon: "🎨",
                  group: "Aparência",
                  content: <AparenciaEditor biosite={biosite} />,
                },
                {
                  id: "integracoes",
                  label: "Integrações",
                  icon: "🔌",
                  group: "Integrações",
                  content: (
                    <section>
                      <h2 className="mb-3 text-lg font-semibold text-neutral-900">Notificações (webhook)</h2>
                      <NotificationWebhookEditor
                        biositeId={id}
                        webhookUrl={biosite.notification_webhook_url}
                      />
                    </section>
                  ),
                },
                {
                  id: "configuracoes",
                  label: "Configurações",
                  icon: "🔒",
                  group: "Configurações",
                  content: (
                    <section>
                      <h2 className="mb-3 text-lg font-semibold text-neutral-900">Acesso do cliente</h2>
                      <ClientAccessEditor biositeId={id} accesses={clientAccesses || []} />
                    </section>
                  ),
                },
              ]}
            />
          </div>

          <LivePreviewPanel url={publicUrl} />
        </div>
      </div>

      <div className="lg:hidden">
        <PreviewPhone url={publicUrl} />
      </div>
      </div>
    </main>
  );
}

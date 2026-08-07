import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ButtonList } from "@/components/biosite/ButtonList";
import { CatalogSection } from "@/components/biosite/CatalogSection";
import { MyBookings } from "@/components/biosite/MyBookings";
import { AddressBlock } from "@/components/biosite/AddressBlock";
import { SocialIconRow } from "@/components/biosite/SocialIconRow";
import { SOCIAL_BUTTON_TYPES } from "@/lib/socialTypes";
import type { BiositeButton, CatalogGroup, CatalogItem } from "@/lib/types";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: biosite } = await supabase
    .from("biosites")
    .select("business_name, description, seo_title, seo_description, seo_keywords, logo_url")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!biosite) return {};

  const title = biosite.seo_title || biosite.business_name;
  const description = biosite.seo_description || biosite.description || undefined;
  const keywords = biosite.seo_keywords
    ? biosite.seo_keywords.split(",").map((k: string) => k.trim())
    : undefined;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: biosite.logo_url ? [biosite.logo_url] : undefined,
    },
  };
}

export default async function BiositePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: biosite } = await supabase
    .from("biosites")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!biosite) notFound();

  const [{ data: buttons }, { data: groups }, { data: profile }] = await Promise.all([
    supabase
      .from("buttons")
      .select("*")
      .eq("biosite_id", biosite.id)
      .order("position", { ascending: true }),
    supabase
      .from("catalog_groups")
      .select("*")
      .eq("biosite_id", biosite.id)
      .order("position", { ascending: true }),
    supabase.from("profiles").select("agency_name, agency_logo_url, agency_link").eq("id", biosite.owner_id).single(),
  ]);

  const groupIds = (groups || []).map((g: CatalogGroup) => g.id);
  const { data: items } = groupIds.length
    ? await supabase
        .from("catalog_items")
        .select("*")
        .in("group_id", groupIds)
        .order("position", { ascending: true })
    : { data: [] as CatalogItem[] };

  const itemsByGroup: Record<string, CatalogItem[]> = {};
  for (const item of items || []) {
    (itemsByGroup[item.group_id] ||= []).push(item);
  }

  const dark = biosite.theme === "dark";
  const allButtons = (buttons || []) as BiositeButton[];
  const addressButtons = allButtons.filter((b) => b.type === "address");
  const socialButtons = allButtons.filter((b) => SOCIAL_BUTTON_TYPES.has(b.type));
  const otherButtons = allButtons.filter((b) => b.type !== "address" && !SOCIAL_BUTTON_TYPES.has(b.type));

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center gap-5 px-4 pb-10 pt-6"
      style={{ backgroundColor: dark ? "#0f0f10" : "#faf9f9" }}
    >
      {biosite.cover_url && (
        <div className="-mx-4 -mt-6 mb-2 h-40 w-[calc(100%+2rem)] overflow-hidden bg-neutral-200">
          {biosite.cover_type === "video" ? (
            <video
              src={biosite.cover_url}
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
              autoPlay
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={biosite.cover_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      )}

      {biosite.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={biosite.logo_url}
          alt={biosite.business_name}
          className={`h-28 w-28 object-cover ${
            biosite.logo_transparent ? "" : "border-4 border-white shadow-lg"
          } ${biosite.logo_shape === "round" ? "rounded-full" : "rounded-2xl"} ${
            biosite.cover_url ? "-mt-16" : ""
          }`}
        />
      )}

      <div className="text-center">
        <h1 className={`text-xl font-bold ${dark ? "text-neutral-50" : "text-neutral-900"}`}>
          {biosite.business_name}
        </h1>
        {biosite.description && (
          <p className={`mt-1 whitespace-pre-line text-sm ${dark ? "text-neutral-400" : "text-neutral-500"}`}>
            {biosite.description}
          </p>
        )}
      </div>

      <MyBookings biositeId={biosite.id} dark={dark} />

      <ButtonList
        biositeId={biosite.id}
        slug={slug}
        buttons={otherButtons}
        merchantName={biosite.business_name}
        primaryColor={biosite.primary_color}
        buttonTextColor={biosite.button_text_color}
      />

      <CatalogSection
        groups={(groups || []) as CatalogGroup[]}
        itemsByGroup={itemsByGroup}
        primaryColor={biosite.primary_color}
        dark={dark}
      />

      {addressButtons.map((button) => (
        <AddressBlock key={button.id} button={button} />
      ))}

      <SocialIconRow biositeId={biosite.id} buttons={socialButtons} />

      {profile?.agency_name && (
        <a
          href={profile.agency_link || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-6 flex items-center gap-2 text-xs ${
            dark ? "text-neutral-500 hover:text-neutral-300" : "text-neutral-400 hover:text-neutral-600"
          }`}
        >
          {profile.agency_logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.agency_logo_url} alt="" className="h-4 w-4 rounded-full" />
          )}
          desenvolvido por {profile.agency_name}
        </a>
      )}
    </main>
  );
}

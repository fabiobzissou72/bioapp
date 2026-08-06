import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { geocodeAddress } from "@/lib/geocode";

type ServiceInput = { name: string; duration: number; price: number | null };
type HoursInput = { weekday: number; start: string; end: string };
type CatalogItemInput = { url: string; mediaType: "image" | "video"; itemType: "product" | "service" };

function normalizeProfileUrl(value: string, host: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${host}/${trimmed.replace(/^@/, "")}`;
}

export async function POST(request: Request) {
  const ownerId = process.env.BRIEFING_OWNER_ID;
  if (!ownerId) {
    return NextResponse.json({ error: "Formulário não configurado." }, { status: 500 });
  }

  const body = await request.json();
  const businessName = String(body.businessName || "").trim();
  const rawSlug = String(body.slug || "").trim();
  const whatsapp = String(body.whatsapp || "").replace(/\D/g, "");

  if (!businessName || !rawSlug || !whatsapp) {
    return NextResponse.json({ error: "Nome, endereço do link e WhatsApp são obrigatórios." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: biosite, error: biositeError } = await admin
    .from("biosites")
    .insert({
      owner_id: ownerId,
      slug: slugify(rawSlug),
      business_name: businessName,
      description: body.description || null,
      primary_color: body.primaryColor || "#ec4899",
      logo_url: body.logoUrl || null,
      cover_url: body.coverUrl || null,
      cover_type: body.coverUrl ? body.coverType || "image" : null,
      published: false,
    })
    .select("id, slug")
    .single();

  if (biositeError || !biosite) {
    const message = biositeError?.code === "23505" ? "Esse endereço já está em uso." : "Erro ao criar biosite.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const biositeId = biosite.id;
  let position = 0;
  const buttons: Record<string, unknown>[] = [];

  buttons.push({
    biosite_id: biositeId,
    type: "whatsapp",
    url: whatsapp,
    position: position++,
    config: {},
  });

  const instagramUrl = body.instagram ? normalizeProfileUrl(body.instagram, "instagram.com") : null;
  if (instagramUrl) {
    buttons.push({ biosite_id: biositeId, type: "instagram", url: instagramUrl, position: position++, config: {} });
  }

  const facebookUrl = body.facebook ? normalizeProfileUrl(body.facebook, "facebook.com") : null;
  if (facebookUrl) {
    buttons.push({ biosite_id: biositeId, type: "facebook", url: facebookUrl, position: position++, config: {} });
  }

  if (body.googleReview) {
    buttons.push({
      biosite_id: biositeId,
      type: "google_review",
      url: body.googleReview,
      position: position++,
      config: {},
    });
  }

  if (body.hasPix && body.pixKey) {
    buttons.push({
      biosite_id: biositeId,
      type: "pix",
      position: position++,
      config: {
        pix_key: body.pixKey,
        pix_key_type: body.pixKeyType || "cpf",
        pix_merchant_city: body.pixCity || "BRASIL",
      },
    });
  }

  const services = (Array.isArray(body.services) ? body.services : ([] as ServiceInput[]))
    .filter((s: ServiceInput) => s.name?.trim())
    .slice(0, 30);

  if (services.length > 0) {
    buttons.push({ biosite_id: biositeId, type: "booking", position: position++, config: {} });
  }

  if (body.hasAddress && body.fullAddress) {
    const coords = await geocodeAddress(body.fullAddress);
    buttons.push({
      biosite_id: biositeId,
      type: "address",
      position: position++,
      config: {
        full_address: body.fullAddress,
        ...(coords ? { address_lat: coords.lat, address_lng: coords.lng } : {}),
      },
    });
  }

  if (body.hasWifi && body.wifiSsid) {
    buttons.push({
      biosite_id: biositeId,
      type: "wifi",
      position: position++,
      config: { wifi_ssid: body.wifiSsid, wifi_password: body.wifiPassword || "" },
    });
  }

  if (buttons.length > 0) await admin.from("buttons").insert(buttons);

  if (services.length > 0) {
    const { data: insertedServices } = await admin
      .from("services")
      .insert(
        services.map((s: ServiceInput) => ({
          biosite_id: biositeId,
          name: s.name.trim(),
          duration_minutes: s.duration || 60,
          price: s.price ?? null,
        }))
      )
      .select("id");

    const staffNames = (Array.isArray(body.staffNames) ? body.staffNames : [])
      .filter((n: string) => n?.trim())
      .slice(0, 10);
    const namesToInsert = staffNames.length > 0 ? staffNames : ["Profissional"];

    const { data: insertedStaff } = await admin
      .from("staff")
      .insert(namesToInsert.map((name: string) => ({ biosite_id: biositeId, name: name.trim() })))
      .select("id");

    if (insertedServices && insertedStaff) {
      await admin.from("staff_services").insert(
        insertedStaff.flatMap((staff) =>
          insertedServices.map((service) => ({ staff_id: staff.id, service_id: service.id }))
        )
      );

      const hours = (Array.isArray(body.hours) ? body.hours : ([] as HoursInput[])).slice(0, 20);
      if (hours.length > 0) {
        await admin.from("availability").insert(
          insertedStaff.flatMap((staff) =>
            hours.map((h: HoursInput) => ({
              staff_id: staff.id,
              weekday: h.weekday,
              start_time: h.start,
              end_time: h.end,
            }))
          )
        );
      }
    }
  }

  const catalogItems = (Array.isArray(body.catalogItems) ? body.catalogItems : ([] as CatalogItemInput[]))
    .filter((c: CatalogItemInput) => c.url)
    .slice(0, 20);

  if (catalogItems.length > 0) {
    const { data: group } = await admin
      .from("catalog_groups")
      .insert({ biosite_id: biositeId, layout: "grid", position: 0 })
      .select("id")
      .single();

    if (group) {
      await admin.from("catalog_items").insert(
        catalogItems.map((item: CatalogItemInput, i: number) => ({
          group_id: group.id,
          media_url: item.url,
          media_type: item.mediaType,
          item_type: item.itemType,
          position: i,
        }))
      );
    }
  }

  return NextResponse.json({ id: biositeId, slug: biosite.slug });
}

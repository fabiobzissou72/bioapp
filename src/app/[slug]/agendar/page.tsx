import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingFlow } from "@/components/biosite/BookingFlow";
import type { Service, Staff } from "@/lib/types";

export const revalidate = 0;

export default async function AgendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: biosite } = await supabase
    .from("biosites")
    .select("id, business_name, primary_color, logo_url")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!biosite) notFound();

  const [{ data: services }, { data: staff }] = await Promise.all([
    supabase.from("services").select("*").eq("biosite_id", biosite.id),
    supabase.from("staff").select("*").eq("biosite_id", biosite.id),
  ]);

  const staffIds = (staff || []).map((s) => s.id);

  const [{ data: staffServices }, { data: availability }] = await Promise.all([
    staffIds.length
      ? supabase.from("staff_services").select("staff_id, service_id").in("staff_id", staffIds)
      : Promise.resolve({ data: [] }),
    staffIds.length
      ? supabase
          .from("availability")
          .select("id, staff_id, weekday, start_time, end_time")
          .in("staff_id", staffIds)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 bg-[#faf9f9] px-4 pb-10 pt-6">
      <div className="flex items-center gap-3">
        {biosite.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={biosite.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
        )}
        <h1 className="text-lg font-bold text-neutral-900">{biosite.business_name}</h1>
      </div>

      <BookingFlow
        biositeId={biosite.id}
        primaryColor={biosite.primary_color}
        services={(services || []) as Service[]}
        staff={(staff || []) as Staff[]}
        staffServices={staffServices || []}
        availability={availability || []}
      />
    </main>
  );
}

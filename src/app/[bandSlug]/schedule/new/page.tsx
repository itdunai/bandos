import { AppShell } from "@/components/layout/app-shell";
import { EventForm } from "@/components/schedule/event-form";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { isBandAdmin } from "@/lib/band/permissions";
import { createClient } from "@/lib/supabase/server";
import type { EventType } from "@/types/database";
import { notFound } from "next/navigation";

export default async function NewEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ bandSlug: string }>;
  searchParams: Promise<{ type?: string; error?: string; date?: string }>;
}) {
  const { bandSlug } = await params;
  const { type, error, date } = await searchParams;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount, supabase] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    createClient(),
  ]);

  const { data: setlists } = await supabase
    .from("setlists")
    .select("id, name")
    .eq("band_id", band.id)
    .order("name");

  const defaultType = (type === "performance" ? "performance" : "rehearsal") as EventType;
  const defaultStartsAt =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T18:00` : undefined;

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title={defaultType === "performance" ? "Новое выступление" : "Новая репетиция"}
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {decodeURIComponent(error)}
        </div>
      )}
      <EventForm
        bandId={band.id}
        bandSlug={band.slug}
        setlists={setlists ?? []}
        defaultType={defaultType}
        defaultStartsAt={defaultStartsAt}
        isAdmin={member ? isBandAdmin(member) : false}
      />
    </AppShell>
  );
}

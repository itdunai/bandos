import { AppShell } from "@/components/layout/app-shell";
import { EventForm } from "@/components/schedule/event-form";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { isBandAdmin } from "@/lib/band/permissions";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ bandSlug: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { bandSlug, id } = await params;
  const { error } = await searchParams;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount, supabase] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    createClient(),
  ]);

  const [{ data: event }, { data: setlists }, { data: financeLink }] =
    await Promise.all([
      supabase.from("events").select("*").eq("id", id).eq("band_id", band.id).single(),
      supabase.from("setlists").select("id, name").eq("band_id", band.id).order("name"),
      supabase
        .from("finance_transactions")
        .select("id")
        .eq("event_id", id)
        .maybeSingle(),
    ]);

  if (!event) notFound();

  return (
    <AppShell band={band} member={member} memberCount={memberCount} title="Редактировать событие">
      {error && (
        <div className="mb-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {decodeURIComponent(error)}
        </div>
      )}
      <EventForm
        bandId={band.id}
        bandSlug={band.slug}
        event={event}
        setlists={setlists ?? []}
        isAdmin={member ? isBandAdmin(member) : false}
        financeRecorded={!!financeLink}
      />
    </AppShell>
  );
}

import { AppShell } from "@/components/layout/app-shell";
import { ScheduleView } from "@/components/schedule/schedule-view";
import { Button } from "@/components/ui/button";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/types/database";
import { hasPermission, isBandAdmin } from "@/lib/band/permissions";
import { bandPath } from "@/lib/paths";
import { Mic2, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ bandSlug: string }>;
}) {
  const { bandSlug } = await params;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount, supabase] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    createClient(),
  ]);

  const [{ data: events }, { data: financeLinks }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("band_id", band.id)
      .order("starts_at", { ascending: true }),
    supabase
      .from("finance_transactions")
      .select("event_id")
      .eq("band_id", band.id)
      .not("event_id", "is", null),
  ]);

  const linkedEventIds = new Set(
    (financeLinks ?? [])
      .map((row) => row.event_id)
      .filter((id): id is string => !!id)
  );

  const scheduleEvents = (events ?? []).map((event) => ({
    ...(event as Event),
    finance_recorded: linkedEventIds.has(event.id),
  }));

  const canEditSchedule = member ? hasPermission(member, "schedule") : false;
  const isAdmin = member ? isBandAdmin(member) : false;

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="График"
      actions={
        canEditSchedule ? (
        <div className="flex gap-2">
          <Link href={bandPath(band.slug, "schedule", "new") + "?type=rehearsal"}>
            <Button>
              <Mic2 className="h-3.5 w-3.5" />
              Репетиция
            </Button>
          </Link>
          <Link href={bandPath(band.slug, "schedule", "new") + "?type=performance"}>
            <Button variant="accent">
              <Plus className="h-3.5 w-3.5" />
              Концерт
            </Button>
          </Link>
        </div>
        ) : undefined
      }
    >
      <ScheduleView
        bandSlug={band.slug}
        bandId={band.id}
        isAdmin={isAdmin}
        events={scheduleEvents}
      />
    </AppShell>
  );
}

import { AppShell } from "@/components/layout/app-shell";
import { FinancePanel } from "@/components/finances/finance-panel";
import { assertFinanceView } from "@/app/actions/finances";
import { isBandAdmin } from "@/lib/band/permissions";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { createClient } from "@/lib/supabase/server";
import type { Band, Event, FinanceTransaction } from "@/types/database";
import { notFound } from "next/navigation";

export default async function FinancesPage({
  params,
}: {
  params: Promise<{ bandSlug: string }>;
}) {
  const { bandSlug } = await params;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  await assertFinanceView(band.id);

  const [member, memberCount, supabase] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    createClient(),
  ]);

  const bandFull = band as Band;

  const [{ data: transactions }, { data: events }] = await Promise.all([
    supabase
      .from("finance_transactions")
      .select("*")
      .eq("band_id", band.id)
      .order("transaction_at", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("id, title, starts_at, fee, event_type")
      .eq("band_id", band.id)
      .eq("event_type", "performance")
      .not("fee", "is", null)
      .gt("fee", 0)
      .order("starts_at", { ascending: false }),
  ]);

  const linkedEventIds = new Set(
    (transactions ?? [])
      .map((tx) => tx.event_id)
      .filter((id): id is string => !!id)
  );

  const unlinkedPerformances = ((events ?? []) as Event[])
    .filter((e) => e.fee != null && !linkedEventIds.has(e.id))
    .map((e) => ({
      id: e.id,
      title: e.title,
      starts_at: e.starts_at,
      fee: Number(e.fee),
    }));

  const openingBalance = Number(bandFull.finance_opening_balance ?? 0);

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="Финансы"
    >
      <FinancePanel
        bandId={band.id}
        bandSlug={band.slug}
        bandName={band.name}
        openingBalance={openingBalance}
        transactions={(transactions ?? []) as FinanceTransaction[]}
        performances={unlinkedPerformances}
        isAdmin={member ? isBandAdmin(member) : false}
      />
    </AppShell>
  );
}

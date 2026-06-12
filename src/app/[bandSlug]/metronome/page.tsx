import { AppShell } from "@/components/layout/app-shell";
import { Metronome } from "@/components/metronome/metronome";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { notFound } from "next/navigation";

export default async function MetronomePage({
  params,
}: {
  params: Promise<{ bandSlug: string }>;
}) {
  const { bandSlug } = await params;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
  ]);

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="Метроном"
    >
      <div className="flex min-h-[50vh] items-center justify-center rounded-xl border border-border bg-bg-2 p-8">
        <Metronome />
      </div>
    </AppShell>
  );
}

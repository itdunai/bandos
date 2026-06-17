import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PlayOfflineList } from "@/components/play/play-offline";
import { Button } from "@/components/ui/button";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { bandPath } from "@/lib/paths";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function PlayOfflinePage({
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
    <AppShell band={band} member={member} memberCount={memberCount} title="Офлайн">
      <Link href={bandPath(band.slug, "play")} className="mb-4 inline-block">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          К режиму «Играем»
        </Button>
      </Link>
      <p className="mb-4 text-sm text-text-secondary">
        Сет-листы, которые вы уже открывали онлайн. Их можно запустить без
        интернета.
      </p>
      <PlayOfflineList bandSlug={band.slug} />
    </AppShell>
  );
}

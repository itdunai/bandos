import { AppShell } from "@/components/layout/app-shell";
import {
  OverviewDashboard,
  OverviewGreeting,
} from "@/components/overview/overview-dashboard";
import { Button } from "@/components/ui/button";
import { getBandOverview } from "@/lib/band/overview";
import { hasPermission } from "@/lib/band/permissions";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { bandPath } from "@/lib/paths";
import type { Band } from "@/types/database";
import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function BandOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ bandSlug: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { bandSlug } = await params;
  const { edit } = await searchParams;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  // Старые ссылки на редактирование профиля вели на главную группы.
  if (edit === "1") redirect(`${bandPath(band.slug, "group")}?edit=1`);

  const [member, memberCount] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
  ]);
  const overview = await getBandOverview(band as Band, member);
  const canEditSchedule = member ? hasPermission(member, "schedule") : false;
  const canEditTodos = member ? hasPermission(member, "todos") : false;

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="Обзор"
      subtitle={<OverviewGreeting name={member?.display_name ?? null} />}
      actions={
        canEditSchedule ? (
          <Link href={bandPath(band.slug, "schedule", "new")}>
            <Button variant="accent">
              <Plus className="h-4 w-4" />
              Событие
            </Button>
          </Link>
        ) : undefined
      }
    >
      <OverviewDashboard
        bandSlug={band.slug}
        data={overview}
        canEditSchedule={canEditSchedule}
        canEditTodos={canEditTodos}
      />
    </AppShell>
  );
}

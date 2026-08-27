import { AppShell } from "@/components/layout/app-shell";
import { ReleaseList } from "@/components/releases/release-list";
import { Button } from "@/components/ui/button";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { hasPermission } from "@/lib/band/permissions";
import { bandPath } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import type { Release, ReleaseLink } from "@/types/database";
import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ReleasesPage({
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

  const { data: releases } = await supabase
    .from("releases")
    .select("*, release_links(platform, url), songs(title)")
    .eq("band_id", band.id)
    .order("released_at", { ascending: false });

  const items = (releases ?? []).map((row) => {
    const { release_links, songs, ...release } = row as Release & {
      release_links: Pick<ReleaseLink, "platform" | "url">[] | null;
      songs: { title: string } | { title: string }[] | null;
    };
    const songTitle = Array.isArray(songs)
      ? songs[0]?.title
      : songs?.title;
    return {
      ...(release as Release),
      links: release_links ?? [],
      song_title: songTitle ?? null,
    };
  });

  const canEdit = member ? hasPermission(member, "songs") : false;

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="Релизы"
      actions={
        canEdit ? (
          <Link href={bandPath(band.slug, "releases", "new")}>
            <Button variant="accent">
              <Plus className="h-3.5 w-3.5" />
              Добавить
            </Button>
          </Link>
        ) : undefined
      }
    >
      <ReleaseList
        releases={items}
        bandSlug={band.slug}
        canCreate={canEdit}
      />
    </AppShell>
  );
}

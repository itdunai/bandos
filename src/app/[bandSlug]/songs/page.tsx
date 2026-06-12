import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/empty-state";
import { RepertoireShare } from "@/components/songs/repertoire-share";
import { SongList } from "@/components/songs/song-list";
import { Button } from "@/components/ui/button";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { createClient } from "@/lib/supabase/server";
import type { Band, Song } from "@/types/database";
import { Music, Plus } from "lucide-react";
import Link from "next/link";
import { hasPermission } from "@/lib/band/permissions";
import { bandPath } from "@/lib/paths";
import { notFound } from "next/navigation";

export default async function SongsPage({
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

  const { data: songs } = await supabase
    .from("songs")
    .select("*")
    .eq("band_id", band.id)
    .order("sort_order")
    .order("title");

  const bandFull = band as Band;
  const canEditSongs = member ? hasPermission(member, "songs") : false;
  const canEditProfile = member ? hasPermission(member, "band_profile") : false;

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="Треки"
      actions={
        (canEditProfile || canEditSongs) ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canEditProfile && (
              <RepertoireShare
                bandId={band.id}
                bandSlug={band.slug}
                isPublic={bandFull.repertoire_public ?? false}
                isAdmin={canEditProfile}
              />
            )}
            {canEditSongs && (
              <Link href={bandPath(band.slug, "songs", "new")}>
                <Button variant="accent">
                  <Plus className="h-3.5 w-3.5" />
                  Добавить
                </Button>
              </Link>
            )}
          </div>
        ) : undefined
      }
    >
      {!songs?.length ? (
        <EmptyState
          icon={<Music className="h-8 w-8" />}
          title="Пока нет треков"
          description="Добавьте первую песню — BPM, тональность, аккорды и табы."
          action={
            canEditSongs ? (
              <Link href={bandPath(band.slug, "songs", "new")}>
                <Button variant="accent">Добавить трек</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <SongList songs={songs as Song[]} bandSlug={band.slug} />
      )}
    </AppShell>
  );
}

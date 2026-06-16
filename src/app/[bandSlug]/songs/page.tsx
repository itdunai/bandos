import { AppShell } from "@/components/layout/app-shell";
import { RepertoireShare } from "@/components/songs/repertoire-share";
import { SongList } from "@/components/songs/song-list";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { createClient } from "@/lib/supabase/server";
import type { Band, Song } from "@/types/database";
import { hasPermission } from "@/lib/band/permissions";
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
        canEditProfile ? (
          <RepertoireShare
            bandId={band.id}
            bandSlug={band.slug}
            isPublic={bandFull.repertoire_public ?? false}
            isAdmin={canEditProfile}
          />
        ) : undefined
      }
    >
      <SongList
        songs={(songs ?? []) as Song[]}
        bandSlug={band.slug}
        canCreate={canEditSongs}
      />
    </AppShell>
  );
}

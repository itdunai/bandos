import { BandHomeShell } from "@/components/band/band-home-shell";
import type { ReleaseListItem } from "@/components/releases/release-list";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { hasPermission } from "@/lib/band/permissions";
import { createClient } from "@/lib/supabase/server";
import type { Band, Release, ReleaseLink } from "@/types/database";
import { notFound } from "next/navigation";

export async function BandHome({
  bandSlug,
  edit,
}: {
  bandSlug: string;
  edit?: string;
}) {
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount, supabase] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    createClient(),
  ]);

  const [{ count: tracksCount }, { data: releasesRows }] = await Promise.all([
    supabase
      .from("songs")
      .select("*", { count: "exact", head: true })
      .eq("band_id", band.id),
    supabase
      .from("releases")
      .select("*, release_links(platform, url), songs(title)")
      .eq("band_id", band.id)
      .order("released_at", { ascending: false })
      .limit(6),
  ]);

  const releases: ReleaseListItem[] = (releasesRows ?? []).map((row) => {
    const { release_links, songs, ...release } = row as Release & {
      release_links: Pick<ReleaseLink, "platform" | "url">[] | null;
      songs: { title: string } | { title: string }[] | null;
    };
    const songTitle = Array.isArray(songs) ? songs[0]?.title : songs?.title;
    return {
      ...(release as Release),
      links: release_links ?? [],
      song_title: songTitle ?? null,
    };
  });

  const canEditProfile = member ? hasPermission(member, "band_profile") : false;

  return (
    <BandHomeShell
      band={band as Band}
      member={member}
      memberCount={memberCount}
      tracksCount={tracksCount ?? 0}
      releases={releases}
      riderSharePath={`/rider/${band.slug}`}
      canEditProfile={canEditProfile}
      initialEdit={edit === "1"}
    />
  );
}

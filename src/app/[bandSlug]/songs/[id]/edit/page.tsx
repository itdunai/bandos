import { AppShell } from "@/components/layout/app-shell";
import { SongForm } from "@/components/songs/song-form";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { createClient } from "@/lib/supabase/server";
import type { Song } from "@/types/database";
import { notFound } from "next/navigation";

export default async function EditSongPage({
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

  const { data: song } = await supabase
    .from("songs")
    .select("*")
    .eq("id", id)
    .eq("band_id", band.id)
    .single();

  if (!song) notFound();

  const { data: contents } = await supabase
    .from("song_contents")
    .select("*")
    .eq("song_id", id);

  const songWithContent = {
    ...(song as Song),
    chords: contents?.find((c) => c.content_type === "chords")?.body ?? "",
    tabs: contents?.find((c) => c.content_type === "tabs")?.body ?? "",
    lyrics: contents?.find((c) => c.content_type === "lyrics")?.body ?? "",
  };

  return (
    <AppShell band={band} member={member} memberCount={memberCount} title="Редактировать трек">
      {error && (
        <div className="mb-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {decodeURIComponent(error)}
        </div>
      )}
      <SongForm bandId={band.id} bandSlug={band.slug} song={songWithContent} />
    </AppShell>
  );
}

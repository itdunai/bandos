import { AppShell } from "@/components/layout/app-shell";
import {
  MetronomeConsole,
  type MetronomeSetlist,
  type MetronomeTrack,
} from "@/components/metronome/metronome-console";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { bandPath } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const metadata = { title: "Метроном" };

export default async function MetronomePage({
  params,
  searchParams,
}: {
  params: Promise<{ bandSlug: string }>;
  searchParams: Promise<{ song?: string }>;
}) {
  const { bandSlug } = await params;
  const { song } = await searchParams;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const supabase = await createClient();
  const [member, memberCount, songsResult, setlistsResult] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    supabase
      .from("songs")
      .select("id, title, key, bpm, time_signature")
      .eq("band_id", band.id)
      .order("title"),
    supabase
      .from("setlists")
      .select("id, name, setlist_items(*)")
      .eq("band_id", band.id)
      .order("created_at", { ascending: false }),
  ]);

  const songs = songsResult.data ?? [];
  const titleById = new Map(songs.map((s) => [s.id, s.title as string]));
  const tracks: MetronomeTrack[] = songs
    .filter((s) => s.bpm)
    .map((s) => ({
      id: s.id,
      title: s.title,
      songKey: s.key,
      bpm: s.bpm as number,
      timeSignature: s.time_signature || "4/4",
    }));
  const withTempo = new Set(tracks.map((t) => t.id));

  const setlists: MetronomeSetlist[] = (setlistsResult.data ?? [])
    .map((sl) => ({
      id: sl.id,
      name: sl.name,
      items: [...(sl.setlist_items ?? [])]
        .filter((item) => item.is_section !== true)
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          title: item.title ?? (item.song_id ? titleById.get(item.song_id) : null) ?? "Без названия",
          trackId: item.song_id,
        })),
    }))
    .filter((sl) => sl.items.some((i) => i.trackId && withTempo.has(i.trackId)));

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="Метроном"
      subtitle={
        <span className="hidden md:inline">
          Пробел — старт/стоп · ← → — темп (с Shift — по 5) · T — тап
        </span>
      }
    >
      <MetronomeConsole
        tracks={tracks}
        setlists={setlists}
        songsHref={bandPath(band.slug, "songs")}
        initialTrackId={song ?? null}
      />
    </AppShell>
  );
}

import Link from "next/link";
import { PlayFromCache } from "@/components/play/play-offline";
import { PlaySetlistShell } from "@/components/play/play-setlist-shell";
import type { PlayTrack } from "@/components/play/play-mode";
import { Button } from "@/components/ui/button";
import {
  getBandBySlug,
  getCurrentMember,
} from "@/lib/band/queries";
import { createClient } from "@/lib/supabase/server";
import type { Instrument } from "@/types/database";
import { ArrowLeft } from "lucide-react";
import { bandPath } from "@/lib/paths";
import { notFound } from "next/navigation";

export default async function PlaySetlistPage({
  params,
  searchParams,
}: {
  params: Promise<{ bandSlug: string; setlistId: string }>;
  searchParams: Promise<{ offline?: string }>;
}) {
  const { bandSlug, setlistId } = await params;
  const { offline } = await searchParams;

  if (offline === "1") {
    return <PlayFromCache bandSlug={bandSlug} setlistId={setlistId} />;
  }

  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const member = await getCurrentMember(band.id);
  if (!member) notFound();

  const supabase = await createClient();

  const { data: setlist } = await supabase
    .from("setlists")
    .select("*")
    .eq("id", setlistId)
    .eq("band_id", band.id)
    .single();

  if (!setlist) notFound();

  const { data: items } = await supabase
    .from("setlist_items")
    .select(
      "id, title, notes, position, songs(id, title, bpm, time_signature, key, structure)"
    )
    .eq("setlist_id", setlistId)
    .order("position");

  type SongRef = {
    id: string;
    title: string;
    bpm: number | null;
    time_signature: string | null;
    key: string | null;
    structure: string | null;
  };

  const songIds =
    items
      ?.map((i) => {
        const song = i.songs as SongRef | SongRef[] | null;
        if (Array.isArray(song)) return song[0]?.id;
        return song?.id;
      })
      .filter((id): id is string => !!id) ?? [];

  let contentsMap: Record<string, PlayTrack["contents"]> = {};

  if (songIds.length > 0) {
    const { data: contents } = await supabase
      .from("song_contents")
      .select("song_id, content_type, instrument, body")
      .in("song_id", songIds);

    contentsMap = (contents ?? []).reduce(
      (acc, c) => {
        if (!acc[c.song_id]) acc[c.song_id] = [];
        acc[c.song_id].push({
          content_type: c.content_type,
          instrument: c.instrument,
          body: c.body,
        });
        return acc;
      },
      {} as Record<string, PlayTrack["contents"]>
    );
  }

  const tracks: PlayTrack[] =
    items?.map((item) => {
      const raw = item.songs as SongRef | SongRef[] | null;
      const song = Array.isArray(raw) ? raw[0] ?? null : raw;

      if (song) {
        return {
          id: item.id,
          title: song.title,
          bpm: song.bpm,
          time_signature: song.time_signature,
          key: song.key,
          structure: song.structure,
          notes: item.notes,
          contents: contentsMap[song.id] ?? [],
        };
      }

      return {
        id: item.id,
        title: item.title ?? "—",
        bpm: null,
        time_signature: null,
        key: null,
        structure: null,
        notes: item.notes,
        contents: [],
      };
    }) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="absolute left-3 top-3 z-10">
        <Link href={bandPath(band.slug, "play")}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
        </Link>
      </div>
      <PlaySetlistShell
        bandSlug={band.slug}
        setlistId={setlistId}
        setlistName={setlist.name}
        tracks={tracks}
        instrument={member.instrument as Instrument}
      />
    </div>
  );
}

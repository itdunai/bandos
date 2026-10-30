import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SetlistEditor, type SetlistItemData } from "@/components/setlists/setlist-editor";
import { Button } from "@/components/ui/button";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { bandPath } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/utils";
import { Play } from "lucide-react";
import { notFound } from "next/navigation";

export default async function SetlistDetailPage({
  params,
}: {
  params: Promise<{ bandSlug: string; id: string }>;
}) {
  const { bandSlug, id } = await params;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount, supabase] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    createClient(),
  ]);

  const { data: setlist } = await supabase
    .from("setlists")
    .select("*")
    .eq("id", id)
    .eq("band_id", band.id)
    .single();

  if (!setlist) notFound();

  type SongRef = {
    title: string;
    key: string | null;
    bpm: number | null;
    duration_sec: number | null;
  };

  // select("*"): is_section появляется в миграции 032 — до неё страница работает
  const [{ data: items }, { data: songs }] = await Promise.all([
    supabase
      .from("setlist_items")
      .select("*, songs(title, key, bpm, duration_sec)")
      .eq("setlist_id", id)
      .order("position"),
    supabase
      .from("songs")
      .select("id, title, key, bpm")
      .eq("band_id", band.id)
      .order("title"),
  ]);

  const editorItems: SetlistItemData[] =
    items?.map((item) => {
      const raw = item.songs as SongRef | SongRef[] | null;
      const song = Array.isArray(raw) ? raw[0] : raw;
      const isSection = item.is_section === true;
      return {
        id: item.id,
        title: song?.title ?? item.title ?? "—",
        subtitle: song
          ? [song.key, song.bpm && `${song.bpm} BPM`, formatDuration(song.duration_sec)]
              .filter(Boolean)
              .join(" · ")
          : undefined,
        notes: item.notes,
        songId: item.song_id,
        isSection,
        durationSec: isSection ? 0 : (item.duration_sec ?? song?.duration_sec ?? 0),
      };
    }) ?? [];

  const tracks = editorItems.filter((i) => !i.isSection);
  const blocksCount = editorItems.length - tracks.length;
  const totalSec = tracks.reduce((sum, i) => sum + (i.durationSec ?? 0), 0);

  const songOptions = (songs ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    meta: [s.key, s.bpm && `${s.bpm} BPM`].filter(Boolean).join(" · ") || undefined,
  }));

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="Сет-лист"
      actions={
        <Link href={bandPath(band.slug, "play", id)}>
          <Button variant="accent">
            <Play className="h-3.5 w-3.5" />
            ИГРАЕМ
          </Button>
        </Link>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-bg-2 p-3">
          <div className="text-xs uppercase text-text-muted">Треков</div>
          <div className="text-xl font-medium">{tracks.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-bg-2 p-3">
          <div className="text-xs uppercase text-text-muted">Длительность</div>
          <div className="text-xl font-medium">{formatDuration(totalSec)}</div>
        </div>
        {blocksCount > 0 && (
          <div className="rounded-xl border border-border bg-bg-2 p-3">
            <div className="text-xs uppercase text-text-muted">Блоков</div>
            <div className="text-xl font-medium">{blocksCount}</div>
          </div>
        )}
      </div>

      <SetlistEditor
        setlistId={id}
        setlistName={setlist.name}
        bandSlug={band.slug}
        initialItems={editorItems}
        songs={songOptions}
      />
    </AppShell>
  );
}

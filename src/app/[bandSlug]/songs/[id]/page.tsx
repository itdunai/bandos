import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { DeleteSongButton } from "@/components/songs/delete-song-button";
import { SongMaterialsView } from "@/components/songs/song-materials-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { hasPermission } from "@/lib/band/permissions";
import { bandPath } from "@/lib/paths";
import { sanitizeHref } from "@/lib/safe-url";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/utils";
import { SONG_STATUS_LABELS, type SongStatus } from "@/types/database";
import { ExternalLink, Pencil } from "lucide-react";
import { notFound } from "next/navigation";

const STATUS_VARIANT: Record<
  SongStatus,
  "green" | "amber" | "purple" | "red"
> = {
  ready: "green",
  in_progress: "amber",
  demo: "purple",
  frozen: "red",
};

export default async function SongDetailPage({
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

  const chords = contents?.find((c) => c.content_type === "chords");
  const tabs = contents?.find((c) => c.content_type === "tabs");
  const lyrics = contents?.find((c) => c.content_type === "lyrics");
  const sourceUrl = sanitizeHref(song.source_url);
  const canEditSongs = member ? hasPermission(member, "songs") : false;

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title={song.title}
      actions={
        canEditSongs ? (
          <div className="flex gap-2">
            <Link href={bandPath(band.slug, "songs", id, "edit")}>
              <Button variant="accent">
                <Pencil className="h-3.5 w-3.5" />
                Редактировать
              </Button>
            </Link>
            <DeleteSongButton
              songId={id}
              bandSlug={band.slug}
              title={song.title}
            />
          </div>
        ) : undefined
      }
    >
      <div className="rounded-xl border border-border bg-bg-2 p-4">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium">{song.title}</h2>
            <p className="text-xs text-text-secondary">
              {song.song_type === "original" ? "Авторская" : "Кавер"}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[song.status as SongStatus]}>
            {SONG_STATUS_LABELS[song.status as SongStatus]}
          </Badge>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {song.bpm && (
            <span className="rounded-md bg-bg-3 px-2.5 py-1 text-xs text-text-secondary">
              BPM: <span className="text-text-primary">{song.bpm}</span>
            </span>
          )}
          {song.time_signature && (
            <span className="rounded-md bg-bg-3 px-2.5 py-1 text-xs text-text-secondary">
              Размер:{" "}
              <span className="text-text-primary">{song.time_signature}</span>
            </span>
          )}
          {song.key && (
            <span className="rounded-md bg-bg-3 px-2.5 py-1 text-xs text-text-secondary">
              Тональность: <span className="text-text-primary">{song.key}</span>
            </span>
          )}
          {song.duration_sec && (
            <span className="rounded-md bg-bg-3 px-2.5 py-1 text-xs text-text-secondary">
              Длительность:{" "}
              <span className="text-text-primary">
                {formatDuration(song.duration_sec)}
              </span>
            </span>
          )}
          {song.genre && (
            <span className="rounded-md bg-bg-3 px-2.5 py-1 text-xs text-text-secondary">
              Жанр: <span className="text-text-primary">{song.genre}</span>
            </span>
          )}
        </div>

        {sourceUrl && (
          <div className="mb-4">
            <h3 className="mb-1 text-xs uppercase tracking-wider text-text-muted">Источник</h3>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {sourceUrl}
            </a>
          </div>
        )}

        {song.structure && (
          <>
            <h3 className="mb-1 text-xs uppercase tracking-wider text-text-muted">Структура</h3>
            <p className="mb-4 text-sm text-text-secondary">{song.structure}</p>
          </>
        )}

        <SongMaterialsView
          chords={chords?.body}
          tabs={tabs?.body}
          lyrics={lyrics?.body}
        />
      </div>
    </AppShell>
  );
}

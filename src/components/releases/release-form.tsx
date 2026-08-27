"use client";

import {
  createRelease,
  deleteRelease,
  updateRelease,
} from "@/app/actions/releases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  RELEASE_PLATFORM_LABELS,
  RELEASE_PLATFORMS,
  type Release,
  type ReleaseLink,
  type ReleasePlatform,
} from "@/types/database";
import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

const selectClass =
  "w-full rounded-lg border border-border bg-bg-3 px-3 py-2 text-sm outline-none focus:border-accent";

interface SongOption {
  id: string;
  title: string;
}

export function ReleaseForm({
  bandId,
  bandSlug,
  songs,
  release,
  links = [],
  defaultSongId,
}: {
  bandId: string;
  bandSlug: string;
  songs: SongOption[];
  release?: Release;
  links?: ReleaseLink[];
  defaultSongId?: string;
}) {
  const [pending, startTransition] = useTransition();
  const isEdit = !!release;
  const initialSongId = release?.song_id || defaultSongId || songs[0]?.id || "";
  const [songId, setSongId] = useState(initialSongId);

  const action = isEdit
    ? updateRelease.bind(null, release.id, bandId, bandSlug)
    : createRelease.bind(null, bandId, bandSlug);

  const linkMap = new Map<ReleasePlatform, string>(
    links.map((l) => [l.platform, l.url])
  );

  const selectedSong = songs.find((s) => s.id === songId);
  const defaultTitle =
    release?.title || selectedSong?.title || "";

  return (
    <form action={action} className="space-y-5">
      <section className="space-y-3 rounded-xl border border-border bg-bg-2 p-4">
        <h2 className="text-sm font-medium">Основное</h2>
        <div>
          <Label>Трек *</Label>
          <select
            name="song_id"
            required
            className={selectClass}
            value={songId}
            onChange={(e) => setSongId(e.target.value)}
          >
            {songs.length === 0 && (
              <option value="">Нет треков в репертуаре</option>
            )}
            {songs.map((song) => (
              <option key={song.id} value={song.id}>
                {song.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Название релиза *</Label>
          <Input
            name="title"
            required
            key={isEdit ? release.id : songId}
            defaultValue={defaultTitle}
            placeholder="Night Drive"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Дата релиза *</Label>
            <Input
              name="released_at"
              type="date"
              required
              defaultValue={
                release?.released_at?.slice(0, 10) ||
                new Date().toISOString().slice(0, 10)
              }
            />
          </div>
          <div>
            <Label>Обложка (URL)</Label>
            <Input
              name="cover_url"
              type="url"
              defaultValue={release?.cover_url ?? ""}
              placeholder="https://..."
            />
          </div>
        </div>
        <div>
          <Label>Заметки</Label>
          <Textarea
            name="notes"
            rows={3}
            defaultValue={release?.notes ?? ""}
            placeholder="Дистрибьютор, UPC, комментарии…"
          />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-bg-2 p-4">
        <h2 className="text-sm font-medium">Ссылки на площадки</h2>
        <p className="text-xs text-text-muted">
          Заполните только те площадки, где трек уже вышел.
        </p>
        <div className="space-y-3">
          {RELEASE_PLATFORMS.map((platform) => (
            <div key={platform}>
              <Label>{RELEASE_PLATFORM_LABELS[platform]}</Label>
              <Input
                name={`link_${platform}`}
                type="url"
                defaultValue={linkMap.get(platform) ?? ""}
                placeholder="https://..."
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-2">
        <SubmitButton
          type="submit"
          variant="accent"
          className="px-6 py-2"
          loadingLabel={isEdit ? "Сохранение…" : "Создание…"}
          disabled={songs.length === 0}
        >
          {isEdit ? "Сохранить" : "Создать"}
        </SubmitButton>
        {isEdit && (
          <Button
            type="button"
            variant="default"
            className="text-red hover:border-red"
            loading={pending}
            disabled={pending}
            onClick={() => {
              if (!confirm(`Удалить релиз «${release.title}»?`)) return;
              startTransition(() => deleteRelease(release.id, bandSlug));
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {pending ? "Удаление…" : "Удалить"}
          </Button>
        )}
      </div>
    </form>
  );
}

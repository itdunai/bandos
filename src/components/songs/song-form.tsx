"use client";

import { createSong, deleteSong, updateSong } from "@/app/actions/songs";
import { SongMaterialsFields } from "@/components/songs/song-materials-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDurationInput } from "@/lib/utils";
import {
  SONG_STATUS_LABELS,
  TIME_SIGNATURES,
  type Song,
  type SongStatus,
  type SongType,
} from "@/types/database";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";

const STATUSES = Object.entries(SONG_STATUS_LABELS) as [SongStatus, string][];
const TYPES: [SongType, string][] = [
  ["original", "Авторская"],
  ["cover", "Кавер"],
];

interface SongFormProps {
  bandId: string;
  bandSlug: string;
  song?: Song & { chords?: string; tabs?: string; lyrics?: string };
}

const selectClass =
  "w-full rounded-lg border border-border bg-bg-3 px-3 py-2 text-sm outline-none focus:border-accent";

export function SongForm({ bandId, bandSlug, song }: SongFormProps) {
  const [pending, startTransition] = useTransition();
  const isEdit = !!song;

  const action = isEdit
    ? updateSong.bind(null, song.id, bandId, bandSlug)
    : createSong.bind(null, bandId, bandSlug);

  return (
    <form action={action} className="space-y-5">
      <section className="rounded-xl border border-border bg-bg-2 p-4 space-y-3">
        <h2 className="text-sm font-medium">Основное</h2>
        <div>
          <Label>Название *</Label>
          <Input name="title" required defaultValue={song?.title} placeholder="Night Drive" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <Label>Статус</Label>
            <select name="status" className={selectClass} defaultValue={song?.status ?? "in_progress"}>
              {STATUSES.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Тип</Label>
            <select name="song_type" className={selectClass} defaultValue={song?.song_type ?? "original"}>
              {TYPES.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>BPM</Label>
            <Input name="bpm" type="number" min={40} max={300} defaultValue={song?.bpm ?? ""} placeholder="128" />
          </div>
          <div>
            <Label>Размер</Label>
            <select
              name="time_signature"
              className={selectClass}
              defaultValue={song?.time_signature ?? "4/4"}
            >
              {TIME_SIGNATURES.map((ts) => (
                <option key={ts} value={ts}>
                  {ts}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Тональность</Label>
            <Input name="key" defaultValue={song?.key ?? ""} placeholder="Em" />
          </div>
          <div>
            <Label>Длительность</Label>
            <Input name="duration" defaultValue={formatDurationInput(song?.duration_sec)} placeholder="4:12" />
          </div>
          <div>
            <Label>Жанр</Label>
            <Input name="genre" defaultValue={song?.genre ?? ""} placeholder="Alt-rock" />
          </div>
        </div>
        <div>
          <Label>Структура</Label>
          <Input
            name="structure"
            defaultValue={song?.structure ?? ""}
            placeholder="Intro → Verse → Chorus → Solo → Outro"
          />
        </div>
        <div>
          <Label>Источник (ссылка)</Label>
          <Input
            name="source_url"
            type="url"
            defaultValue={song?.source_url ?? ""}
            placeholder="https://disk.yandex.ru/... или YouTube"
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-bg-2 p-4 space-y-3">
        <h2 className="text-sm font-medium">Материалы</h2>
        <SongMaterialsFields
          chords={song?.chords}
          tabs={song?.tabs}
          lyrics={song?.lyrics}
        />
      </section>

      <div className="flex gap-2">
        <SubmitButton type="submit" variant="accent" className="px-6 py-2" loadingLabel={isEdit ? "Сохранение…" : "Создание…"}>
          {isEdit ? "Сохранить" : "Создать трек"}
        </SubmitButton>
        {isEdit && (
          <Button
            type="button"
            variant="default"
            loading={pending}
            disabled={pending}
            className="text-red hover:border-red hover:text-red"
            onClick={() => {
              if (confirm("Удалить трек?")) {
                startTransition(() => deleteSong(song.id, bandSlug));
              }
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

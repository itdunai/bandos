"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { bandPath } from "@/lib/paths";
import { cn, formatDuration } from "@/lib/utils";
import {
  SONG_STATUS_LABELS,
  SONG_TYPE_LABELS,
  type Song,
  type SongStatus,
  type SongType,
} from "@/types/database";
import { Music, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const STATUS_VARIANT: Record<
  SongStatus,
  "green" | "amber" | "purple" | "red"
> = {
  ready: "green",
  in_progress: "amber",
  demo: "purple",
  frozen: "red",
};

const STATUSES = Object.entries(SONG_STATUS_LABELS) as [SongStatus, string][];
const TYPES = Object.entries(SONG_TYPE_LABELS) as [SongType, string][];

export function SongList({
  songs,
  bandSlug,
}: {
  songs: Song[];
  bandSlug: string;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SongStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<SongType | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return songs.filter((song) => {
      if (statusFilter !== "all" && song.status !== statusFilter) return false;
      if (typeFilter !== "all" && song.song_type !== typeFilter) return false;
      if (!q) return true;
      const haystack = [
        song.title,
        song.key,
        song.genre,
        SONG_STATUS_LABELS[song.status],
        SONG_TYPE_LABELS[song.song_type],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [songs, query, statusFilter, typeFilter]);

  const meta = (song: Song) =>
    [song.key, song.bpm && `${song.bpm} BPM`, formatDuration(song.duration_sec)]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию, тональности..."
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
          label="Все статусы"
        />
        {STATUSES.map(([value, label]) => (
          <FilterChip
            key={value}
            active={statusFilter === value}
            onClick={() => setStatusFilter(value)}
            label={label}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={typeFilter === "all"}
          onClick={() => setTypeFilter("all")}
          label="Все типы"
        />
        {TYPES.map(([value, label]) => (
          <FilterChip
            key={value}
            active={typeFilter === value}
            onClick={() => setTypeFilter(value)}
            label={label}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-secondary">
          Ничего не найдено
        </p>
      ) : (
        <>
          {/* Мобилка: список */}
          <ul className="space-y-1.5 md:hidden">
            {filtered.map((song) => (
              <li key={song.id}>
                <Link
                  href={bandPath(bandSlug, "songs", song.id)}
                  className="flex items-center gap-3 rounded-lg border border-border bg-bg-2 px-3 py-2.5 transition-colors hover:border-accent"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bg-3 text-accent">
                    <Music className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{song.title}</div>
                    <div className="truncate text-[11px] text-text-secondary">
                      {meta(song)}
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT[song.status]}>
                    {SONG_STATUS_LABELS[song.status]}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>

          {/* Десктоп: плитка 5 колонок */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {filtered.map((song) => (
              <Link
                key={song.id}
                href={bandPath(bandSlug, "songs", song.id)}
                className="flex flex-col rounded-lg border border-border bg-bg-2 p-2.5 transition-colors hover:border-accent"
              >
                <div className="mb-2 flex items-start justify-between gap-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-bg-3 text-accent">
                    <Music className="h-3.5 w-3.5" />
                  </div>
                  <Badge variant={STATUS_VARIANT[song.status]} className="text-[10px]">
                    {SONG_STATUS_LABELS[song.status]}
                  </Badge>
                </div>
                <div className="text-sm font-medium leading-snug line-clamp-2">{song.title}</div>
                {meta(song) && (
                  <div className="mt-1 text-[10px] text-text-secondary line-clamp-1">{meta(song)}</div>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

      <p className="text-center text-[11px] text-text-muted">
        {filtered.length} из {songs.length}
      </p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs transition-colors",
        active
          ? "bg-accent/15 text-accent"
          : "bg-bg-3 text-text-secondary hover:text-text-primary"
      )}
    >
      {label}
    </button>
  );
}

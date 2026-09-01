"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { LayoutGrid, Music, Plus, Search, Table2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

type SongViewMode = "tiles" | "table";

const VIEW_STORAGE_KEY = "bandos-songs-view";

function loadViewMode(): SongViewMode {
  if (typeof window === "undefined") return "tiles";
  const stored = localStorage.getItem(VIEW_STORAGE_KEY);
  return stored === "table" ? "table" : "tiles";
}

export function SongList({
  songs,
  bandSlug,
  canCreate = false,
}: {
  songs: Song[];
  bandSlug: string;
  canCreate?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SongStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<SongType | "all">("all");
  const [viewMode, setViewMode] = useState<SongViewMode>("tiles");

  useEffect(() => {
    setViewMode(loadViewMode());
  }, []);

  function changeViewMode(mode: SongViewMode) {
    setViewMode(mode);
    localStorage.setItem(VIEW_STORAGE_KEY, mode);
  }

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

  const showAddCard =
    canCreate && statusFilter === "all" && typeFilter === "all" && !query.trim();

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию, тональности..."
            className="pl-9"
          />
        </div>
        <div className="flex shrink-0 rounded-lg border border-border bg-bg-2 p-0.5">
          <Button
            type="button"
            variant={viewMode === "tiles" ? "accent" : "ghost"}
            size="sm"
            className="gap-1.5 px-2.5"
            onClick={() => changeViewMode("tiles")}
            aria-pressed={viewMode === "tiles"}
            aria-label="Плитки"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Плитки</span>
          </Button>
          <Button
            type="button"
            variant={viewMode === "table" ? "accent" : "ghost"}
            size="sm"
            className="gap-1.5 px-2.5"
            onClick={() => changeViewMode("table")}
            aria-pressed={viewMode === "table"}
            aria-label="Таблица"
          >
            <Table2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Таблица</span>
          </Button>
        </div>
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

      {filtered.length === 0 && !showAddCard ? (
        <p className="py-8 text-center text-sm text-text-secondary">
          Ничего не найдено
        </p>
      ) : viewMode === "table" ? (
        <>
          <div className="md:hidden">
            <SongMobileList
              songs={filtered}
              bandSlug={bandSlug}
              showAddCard={showAddCard}
              meta={meta}
            />
          </div>
          <div className="hidden md:block">
            <SongTable
              songs={filtered}
              bandSlug={bandSlug}
              showAddRow={showAddCard}
            />
          </div>
        </>
      ) : (
        <>
          <SongMobileList
            songs={filtered}
            bandSlug={bandSlug}
            showAddCard={showAddCard}
            meta={meta}
            className="md:hidden"
          />

          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {showAddCard && <AddSongLink bandSlug={bandSlug} variant="tile" />}
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

function SongMobileList({
  songs,
  bandSlug,
  showAddCard,
  meta,
  className,
}: {
  songs: Song[];
  bandSlug: string;
  showAddCard: boolean;
  meta: (song: Song) => string;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-1.5", className)}>
      {showAddCard && (
        <li>
          <AddSongLink bandSlug={bandSlug} variant="list" />
        </li>
      )}
      {songs.map((song) => (
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
            <Badge variant={STATUS_VARIANT[song.status]} className="shrink-0">
              {SONG_STATUS_LABELS[song.status]}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SongTable({
  songs,
  bandSlug,
  showAddRow,
}: {
  songs: Song[];
  bandSlug: string;
  showAddRow: boolean;
}) {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-2 text-xs uppercase tracking-wider text-text-muted">
            <th className="px-4 py-3 font-medium">Название</th>
            <th className="px-4 py-3 font-medium">Тип</th>
            <th className="px-4 py-3 font-medium">Статус</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Тональность</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">BPM</th>
            <th className="hidden px-4 py-3 font-medium lg:table-cell">Размер</th>
            <th className="px-4 py-3 text-right font-medium">Длительность</th>
          </tr>
        </thead>
        <tbody>
          {showAddRow && (
            <tr className="border-b border-border/50">
              <td colSpan={7} className="px-4 py-2">
                <Link
                  href={bandPath(bandSlug, "songs", "new")}
                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Добавить трек
                </Link>
              </td>
            </tr>
          )}
          {songs.map((song) => (
            <tr
              key={song.id}
              className="border-b border-border/50 transition-colors last:border-0 hover:bg-bg-2/80"
            >
              <td className="px-4 py-3 font-medium">
                <Link
                  href={bandPath(bandSlug, "songs", song.id)}
                  className="flex items-center gap-2 hover:text-accent"
                >
                  <Music className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span className="truncate">{song.title}</span>
                </Link>
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {SONG_TYPE_LABELS[song.song_type]}
              </td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_VARIANT[song.status]}>
                  {SONG_STATUS_LABELS[song.status]}
                </Badge>
              </td>
              <td className="hidden px-4 py-3 text-text-secondary sm:table-cell">
                {song.key ?? "—"}
              </td>
              <td className="hidden px-4 py-3 text-text-secondary md:table-cell">
                {song.bpm ?? "—"}
              </td>
              <td className="hidden px-4 py-3 text-text-secondary lg:table-cell">
                {song.time_signature || "—"}
              </td>
              <td className="px-4 py-3 text-right text-text-secondary">
                {formatDuration(song.duration_sec)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddSongLink({
  bandSlug,
  variant,
}: {
  bandSlug: string;
  variant: "list" | "tile";
}) {
  const href = bandPath(bandSlug, "songs", "new");

  if (variant === "list") {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-bg-2 px-3 py-2.5 text-accent transition-colors hover:border-accent"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bg-3">
          <Plus className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">Добавить трек</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="flex min-h-[88px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-bg-2 p-2.5 text-accent transition-colors hover:border-accent"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-bg-3">
        <Plus className="h-4 w-4" />
      </div>
      <span className="mt-2 text-xs font-medium">Добавить</span>
    </Link>
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

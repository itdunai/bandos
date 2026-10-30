"use client";

import { cn } from "@/lib/utils";
import { Check, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface SongPickerOption {
  id: string;
  title: string;
  meta?: string;
}

const MAX_RESULTS = 50;

/**
 * Поиск трека для сет-листа: ввод фильтрует список, клик или Enter добавляет.
 * Стрелки — по списку, Esc — закрыть. Треки, уже стоящие в сет-листе, помечены.
 */
export function SongPicker({
  songs,
  usedIds,
  onPick,
  disabled,
}: {
  songs: SongPickerOption[];
  usedIds: Set<string>;
  onPick: (songId: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? songs.filter((s) => s.title.toLowerCase().includes(q)) : songs;
    return list.slice(0, MAX_RESULTS);
  }, [songs, query]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function pick(id: string) {
    onPick(id);
    setQuery("");
    setActive(0);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const song = results[active];
      if (open && song) pick(song.id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={songs.length ? "Найти и добавить трек…" : "В библиотеке пока нет треков"}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Добавить трек"
          className="w-full rounded-lg border border-border bg-bg-3 py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
        />
      </div>

      {open && songs.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border-strong bg-bg-2 p-1 shadow-xl"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-text-muted">Ничего не нашлось</li>
          ) : (
            results.map((song, i) => {
              const used = usedIds.has(song.id);
              return (
                <li
                  key={song.id}
                  role="option"
                  aria-selected={i === active}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => pick(song.id)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm",
                    i === active ? "bg-bg-4" : "hover:bg-bg-3"
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{song.title}</span>
                    {song.meta && (
                      <span className="block truncate text-xs text-text-secondary">{song.meta}</span>
                    )}
                  </span>
                  {used && (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-text-muted">
                      <Check className="h-3.5 w-3.5" />
                      уже есть
                    </span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

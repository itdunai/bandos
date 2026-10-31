"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstrumentView } from "@/components/play/instrument-view";
import type { PlayTextPrefs } from "@/lib/play/text-prefs";
import type { Instrument } from "@/types/database";

export interface PlayTrack {
  id: string;
  title: string;
  bpm: number | null;
  time_signature: string | null;
  key: string | null;
  structure: string | null;
  notes: string | null;
  contents: { content_type: string; instrument: string | null; body: string }[];
  /** Блок сет-листа («Блок 2», «Бис»); нет — сет-лист без блоков */
  block?: string | null;
}

/** Место трека в его блоке: «Блок 2 · 3 из 5». Блок — подряд идущие треки с одним названием. */
function blockPosition(tracks: PlayTrack[], index: number) {
  const name = tracks[index]?.block;
  if (!name) return null;
  let start = index;
  while (start > 0 && tracks[start - 1].block === name) start--;
  let end = index;
  while (end < tracks.length - 1 && tracks[end + 1].block === name) end++;
  return { name, number: index - start + 1, size: end - start + 1 };
}

const SWIPE_THRESHOLD = 50;

export function PlayMode({
  setlistName,
  tracks,
  instrument,
  textPrefs,
}: {
  setlistName: string;
  tracks: PlayTrack[];
  instrument: Instrument;
  textPrefs?: PlayTextPrefs;
}) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const track = tracks[index];
  const block = blockPosition(tracks, index);

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setIndex((i) => Math.min(tracks.length - 1, i + 1));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;

    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;

    if (dx < 0) goNext();
    else goPrev();
  }

  if (!tracks.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-text-secondary">
        Сет-лист пуст
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-bg">
      <header className="shrink-0 border-b border-border px-4 py-3">
        <div className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
          {setlistName}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            disabled={index === 0}
            onClick={goPrev}
            aria-label="Предыдущий трек"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1 text-center">
            {block ? (
              <div className="flex items-center justify-center gap-1.5 text-xs">
                <span className="truncate font-semibold uppercase tracking-wide text-accent">
                  {block.name}
                </span>
                <span className="shrink-0 text-text-muted">
                  · {block.number} из {block.size}
                </span>
                <span className="shrink-0 text-text-muted/70">
                  ({index + 1}/{tracks.length})
                </span>
              </div>
            ) : (
              <div className="text-xs text-text-muted">
                {index + 1} / {tracks.length}
              </div>
            )}
            <div className="heading-poster mt-0.5 truncate text-lg sm:text-xl">{track.title}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            disabled={index === tracks.length - 1}
            onClick={goNext}
            aria-label="Следующий трек"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div
        className="flex min-h-0 flex-1 flex-col touch-pan-y md:touch-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <InstrumentView key={track.id} track={track} instrument={instrument} textPrefs={textPrefs} />
      </div>

      <footer className="shrink-0 border-t border-border px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex justify-center gap-1.5">
          {tracks.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index
                  ? "w-6 bg-accent"
                  : "w-2 bg-bg-3 hover:bg-accent/40"
              } ${i > 0 && t.block !== tracks[i - 1].block ? "ml-2" : ""}`}
              aria-label={t.block ? `${t.block}, трек ${i + 1}` : `Трек ${i + 1}`}
            />
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] text-text-muted md:hidden">
          Свайп влево/вправо — переключение треков
        </p>
      </footer>
    </div>
  );
}

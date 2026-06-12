"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstrumentView } from "@/components/play/instrument-view";
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
}

const SWIPE_THRESHOLD = 50;

export function PlayMode({
  setlistName,
  tracks,
  instrument,
}: {
  setlistName: string;
  tracks: PlayTrack[];
  instrument: Instrument;
}) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const track = tracks[index];

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
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="shrink-0 border-b border-border px-4 py-3">
        <div className="text-center text-[11px] uppercase tracking-wider text-text-muted">
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
            <div className="text-xs text-text-muted">
              {index + 1} / {tracks.length}
            </div>
            <div className="truncate text-lg font-medium">{track.title}</div>
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
        <InstrumentView track={track} instrument={instrument} />
      </div>

      <footer className="shrink-0 border-t border-border p-3">
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
              }`}
              aria-label={`Трек ${i + 1}`}
            />
          ))}
        </div>
        <p className="mt-2 text-center text-[10px] text-text-muted md:hidden">
          Свайп влево/вправо — переключение треков
        </p>
      </footer>
    </div>
  );
}

"use client";

import type { Instrument } from "@/types/database";
import { Metronome } from "@/components/metronome/metronome";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { useState } from "react";

interface SongContent {
  content_type: string;
  instrument: string | null;
  body: string;
}

interface TrackData {
  title: string;
  bpm: number | null;
  time_signature: string | null;
  key: string | null;
  structure: string | null;
  notes: string | null;
  contents: SongContent[];
}

export function InstrumentView({
  track,
  instrument,
}: {
  track: TrackData;
  instrument: Instrument;
}) {
  const chords = track.contents.find((c) => c.content_type === "chords");
  const tabs = track.contents.find(
    (c) => c.content_type === "tabs" && (c.instrument === "bass" || !c.instrument)
  );
  const lyrics = track.contents.find((c) => c.content_type === "lyrics");

  const canToggleLyrics =
    (instrument === "guitar" || instrument === "bass") && !!lyrics?.body;
  const [showLyrics, setShowLyrics] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-text-secondary">
        {track.key && (
          <span className="rounded-md bg-bg-3 px-3 py-1">
            <span className="text-text-muted">Тональность </span>
            <span className="font-medium text-text-primary">{track.key}</span>
          </span>
        )}
        {track.bpm && (
          <span className="rounded-md bg-bg-3 px-3 py-1">
            <span className="text-text-muted">BPM </span>
            <span className="font-medium text-text-primary">{track.bpm}</span>
          </span>
        )}
        {track.time_signature && (
          <span className="rounded-md bg-bg-3 px-3 py-1">
            <span className="text-text-muted">Размер </span>
            <span className="font-medium text-text-primary">
              {track.time_signature}
            </span>
          </span>
        )}
      </div>

      {canToggleLyrics && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowLyrics((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
              showLyrics
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-bg-3 text-text-secondary hover:text-text-primary"
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            {showLyrics ? "Скрыть текст" : "Показать текст"}
          </button>
        </div>
      )}

      {track.structure && (instrument === "drums" || instrument === "other") && (
        <section>
          <h3 className="mb-2 text-center text-[10px] uppercase tracking-widest text-text-muted">
            Структура
          </h3>
          <p className="text-center text-sm text-text-secondary">{track.structure}</p>
        </section>
      )}

      {(instrument === "guitar" || instrument === "keys") && chords?.body && (
        <section className="flex-1">
          <h3 className="mb-3 text-center text-[10px] uppercase tracking-widest text-text-muted">
            Аккорды
          </h3>
          <pre className="text-center font-mono text-2xl leading-relaxed text-accent whitespace-pre-wrap sm:text-3xl">
            {chords.body}
          </pre>
        </section>
      )}

      {instrument === "bass" && tabs?.body && (
        <section className="flex-1">
          <h3 className="mb-3 text-center text-[10px] uppercase tracking-widest text-text-muted">
            Табы
          </h3>
          <pre className="text-center font-mono text-lg leading-relaxed text-text-primary whitespace-pre-wrap">
            {tabs.body}
          </pre>
        </section>
      )}

      {instrument === "vocals" && lyrics?.body && (
        <section className="flex-1">
          <h3 className="mb-3 text-center text-[10px] uppercase tracking-widest text-text-muted">
            Текст
          </h3>
          <pre className="text-center text-lg leading-relaxed text-text-primary whitespace-pre-wrap sm:text-xl">
            {lyrics.body}
          </pre>
        </section>
      )}

      {showLyrics && canToggleLyrics && lyrics?.body && (
        <section className="flex-1 border-t border-border pt-4">
          <h3 className="mb-3 text-center text-[10px] uppercase tracking-widest text-text-muted">
            Текст
          </h3>
          <pre className="text-center text-base leading-relaxed text-text-primary whitespace-pre-wrap sm:text-lg">
            {lyrics.body}
          </pre>
        </section>
      )}

      {instrument === "drums" && (
        <section className="flex flex-1 flex-col items-center justify-center">
          <Metronome
            key={`${track.title}-${track.bpm}-${track.time_signature}`}
            initialBpm={track.bpm ?? 120}
            initialTimeSignature={track.time_signature ?? "4/4"}
            compact
          />
        </section>
      )}

      {track.notes && (
        <p className="text-center text-xs text-amber">{track.notes}</p>
      )}

      {!hasContent(track, instrument, showLyrics) && (
        <p className="py-8 text-center text-sm text-text-muted">
          Нет материалов для вашего инструмента
        </p>
      )}
    </div>
  );
}

function hasContent(
  track: TrackData,
  instrument: Instrument,
  showLyrics: boolean
): boolean {
  if (instrument === "guitar" || instrument === "keys") {
    const hasChords = !!track.contents.find((c) => c.content_type === "chords")?.body;
    const hasLyrics =
      showLyrics &&
      !!track.contents.find((c) => c.content_type === "lyrics")?.body;
    return hasChords || hasLyrics;
  }
  if (instrument === "bass") {
    const hasTabs = !!track.contents.find((c) => c.content_type === "tabs")?.body;
    const hasLyrics =
      showLyrics &&
      !!track.contents.find((c) => c.content_type === "lyrics")?.body;
    return hasTabs || hasLyrics;
  }
  if (instrument === "vocals") {
    return !!track.contents.find((c) => c.content_type === "lyrics")?.body;
  }
  if (instrument === "drums") {
    return true;
  }
  return !!(track.structure || track.contents.length);
}

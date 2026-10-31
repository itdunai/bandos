"use client";

import type { Instrument } from "@/types/database";
import { Metronome } from "@/components/metronome/metronome";
import {
  DEFAULT_PLAY_TEXT_PREFS,
  playFontClass,
  type PlayTextPrefs,
} from "@/lib/play/text-prefs";
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

/** Базовый размер (rem) — умножается на «A−/A+» из настроек пользователя. */
const BASE_REM = { chords: 1.75, tabs: 1.125, lyrics: 1.25, lyricsSecondary: 1.0625 };

export function InstrumentView({
  track,
  instrument,
  textPrefs = DEFAULT_PLAY_TEXT_PREFS,
}: {
  track: TrackData;
  instrument: Instrument;
  textPrefs?: PlayTextPrefs;
}) {
  const align = textPrefs.align === "left" ? "text-left" : "text-center";
  const textBlock = (kind: "chords" | "tabs" | "lyrics", base: number, color: string) => ({
    className: cn("leading-relaxed whitespace-pre-wrap", align, color, playFontClass(textPrefs.font, kind)),
    style: { fontSize: `${(base * textPrefs.scale).toFixed(3)}rem` },
  });
  const heading = cn("mb-3 text-[11px] uppercase tracking-widest text-text-muted", align);
  const chords = track.contents.find((c) => c.content_type === "chords");
  const tabs = track.contents.find(
    (c) => c.content_type === "tabs" && (c.instrument === "bass" || !c.instrument)
  );
  const lyrics = track.contents.find((c) => c.content_type === "lyrics");

  const canToggleLyrics =
    (instrument === "guitar" || instrument === "bass") && !!lyrics?.body;
  const [showLyrics, setShowLyrics] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4 pb-12">
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
          <h3 className="mb-2 text-center text-[11px] uppercase tracking-widest text-text-muted">
            Структура
          </h3>
          <p className="text-center text-sm text-text-secondary">{track.structure}</p>
        </section>
      )}

      {(instrument === "guitar" || instrument === "keys") && chords?.body && (
        <section className="flex-1">
          <h3 className={heading}>Аккорды</h3>
          <pre {...textBlock("chords", BASE_REM.chords, "text-accent")}>
            {chords.body}
          </pre>
        </section>
      )}

      {instrument === "bass" && tabs?.body && (
        <section className="flex-1">
          <h3 className={heading}>Табы</h3>
          <pre {...textBlock("tabs", BASE_REM.tabs, "text-text-primary")}>
            {tabs.body}
          </pre>
        </section>
      )}

      {instrument === "vocals" && lyrics?.body && (
        <section className="flex-1">
          <h3 className={heading}>Текст</h3>
          <pre {...textBlock("lyrics", BASE_REM.lyrics, "text-text-primary")}>
            {lyrics.body}
          </pre>
        </section>
      )}

      {showLyrics && canToggleLyrics && lyrics?.body && (
        <section className="flex-1 border-t border-border pt-4">
          <h3 className={heading}>Текст</h3>
          <pre {...textBlock("lyrics", BASE_REM.lyricsSecondary, "text-text-primary")}>
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

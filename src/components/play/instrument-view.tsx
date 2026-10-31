"use client";

import type { Instrument } from "@/types/database";
import { Metronome } from "@/components/metronome/metronome";
import { useTranspose } from "@/components/play/use-transpose";
import {
  detectNotation,
  formatSemitones,
  parseChordSheet,
  transposeKey,
} from "@/lib/chords";
import { PLAY_FONT_CLASS } from "@/lib/play/fonts";
import {
  DEFAULT_PLAY_TEXT_PREFS,
  resolvePlayFont,
  type PlayTextPrefs,
} from "@/lib/play/text-prefs";
import { cn } from "@/lib/utils";
import { FileText, Minus, Plus, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

interface SongContent {
  content_type: string;
  instrument: string | null;
  body: string;
}

interface TrackData {
  /** Пункт сет-листа — ключ сдвига тональности */
  id: string;
  title: string;
  bpm: number | null;
  time_signature: string | null;
  key: string | null;
  structure: string | null;
  notes: string | null;
  contents: SongContent[];
}

/**
 * Базовый размер (rem) — умножается на «A−/A+» из настроек пользователя.
 * Аккорды часто записаны вместе со словами — база как у текста, иначе при
 * одном масштабе аккорды выходят заметно крупнее «Текста» под ними.
 */
const BASE_REM = { chords: 1.125, tabs: 1.125, lyrics: 1.25, lyricsSecondary: 1.0625 };

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
    className: cn("leading-relaxed whitespace-pre-wrap", align, color, PLAY_FONT_CLASS[resolvePlayFont(textPrefs.font, kind)]),
    style: { fontSize: `${(base * textPrefs.scale).toFixed(3)}rem` },
  });
  const heading = cn("mb-3 text-[11px] uppercase tracking-widest text-text-muted", align);
  const chords = track.contents.find((c) => c.content_type === "chords");
  const tabs = track.contents.find(
    (c) => c.content_type === "tabs" && (c.instrument === "bass" || !c.instrument)
  );
  const lyrics = track.contents.find((c) => c.content_type === "lyrics");

  const showChords = (instrument === "guitar" || instrument === "keys") && !!chords?.body;
  const [semitones, setSemitones] = useTranspose(track.id);
  const notation = useMemo(() => detectNotation(chords?.body ?? ""), [chords?.body]);
  const chordLines = useMemo(
    () => (showChords && chords ? parseChordSheet(chords.body, semitones, notation) : []),
    [showChords, chords, semitones, notation]
  );
  const shownKey = showChords ? transposeKey(track.key, semitones, notation) : track.key;

  const canToggleLyrics =
    (instrument === "guitar" || instrument === "bass") && !!lyrics?.body;
  const [showLyrics, setShowLyrics] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4 pb-12">
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-text-secondary">
        {shownKey && (
          <span className="rounded-md bg-bg-3 px-3 py-1">
            <span className="text-text-muted">Тональность </span>
            <span className={cn("font-medium", semitones ? "text-accent" : "text-text-primary")}>
              {shownKey}
            </span>
            {semitones !== 0 && track.key && (
              <span className="text-text-muted"> · было {track.key}</span>
            )}
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

      {showChords && (
        <section className="flex-1">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className={cn(heading, "mb-0")}>Аккорды</h3>
            <div className="flex items-center gap-1" role="group" aria-label="Транспонирование">
              <button
                type="button"
                onClick={() => setSemitones(semitones - 1)}
                aria-label="Ниже на полутон"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg-3 text-text-secondary hover:text-text-primary"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span
                className={cn(
                  "min-w-[64px] text-center text-xs tabular-nums",
                  semitones ? "font-semibold text-accent" : "text-text-muted"
                )}
                aria-live="polite"
              >
                Тон {formatSemitones(semitones)}
              </span>
              <button
                type="button"
                onClick={() => setSemitones(semitones + 1)}
                aria-label="Выше на полутон"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg-3 text-text-secondary hover:text-text-primary"
              >
                <Plus className="h-4 w-4" />
              </button>
              {semitones !== 0 && (
                <button
                  type="button"
                  onClick={() => setSemitones(0)}
                  aria-label="Вернуть исходную тональность"
                  title="Исходная тональность"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-text-primary"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <pre {...textBlock("chords", BASE_REM.chords, "text-text-primary")}>
            {chordLines.map((line, i) => (
              <span key={i}>
                {line.segments.map((seg, j) =>
                  seg.chord ? (
                    <span key={j} className="font-semibold text-accent">
                      {seg.text}
                    </span>
                  ) : (
                    seg.text
                  )
                )}
                {i < chordLines.length - 1 && "\n"}
              </span>
            ))}
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

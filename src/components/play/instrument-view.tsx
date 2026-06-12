import type { Instrument } from "@/types/database";
import { Metronome } from "@/components/metronome/metronome";

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

      {!hasContent(track, instrument) && (
        <p className="py-8 text-center text-sm text-text-muted">
          Нет материалов для вашего инструмента
        </p>
      )}
    </div>
  );
}

function hasContent(track: TrackData, instrument: Instrument): boolean {
  if (instrument === "guitar" || instrument === "keys") {
    return !!track.contents.find((c) => c.content_type === "chords")?.body;
  }
  if (instrument === "bass") {
    return !!track.contents.find((c) => c.content_type === "tabs")?.body;
  }
  if (instrument === "vocals") {
    return !!track.contents.find((c) => c.content_type === "lyrics")?.body;
  }
  if (instrument === "drums") {
    return true;
  }
  return !!(track.structure || track.contents.length);
}

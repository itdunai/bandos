"use client";

import { BeatCells } from "@/components/metronome/beat-cells";
import { useMetronome } from "@/components/metronome/use-metronome";
import { useMetronomeSettings } from "@/components/metronome/use-metronome-settings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { METRONOME_SOUND_LABELS, type MetronomeSound } from "@/lib/metronome-sounds";
import {
  bpmFromTaps,
  clampBpm,
  defaultAccents,
  nextAccent,
  type AccentLevel,
} from "@/lib/metronome/rhythm";
import { Hand, Minus, Plus, Zap, ZapOff } from "lucide-react";
import { useRef, useState } from "react";

const TRAINING_OFF = {
  trainer: { enabled: false, step: 0, everyBars: 0, maxBpm: 0 },
  gap: { enabled: false, playBars: 0, muteBars: 0 },
};

/**
 * Компактный метроном для режима «Играем» (барабанщик): темп и размер трека.
 * Звук, громкость, деление доли и вспышка — общие с разделом «Метроном».
 * Перемонтируется по key при смене трека.
 */
export function Metronome({
  initialBpm = 120,
  initialTimeSignature = "4/4",
}: {
  initialBpm?: number;
  initialTimeSignature?: string;
}) {
  const [settings, updateSettings] = useMetronomeSettings();
  const [bpm, setBpmState] = useState(clampBpm(initialBpm));
  const [levels, setLevels] = useState<AccentLevel[]>(() => defaultAccents(initialTimeSignature));
  const [tapping, setTapping] = useState(false);
  const tapsRef = useRef<number[]>([]);

  const { playing, pulse, start, stop, click } = useMetronome({
    bpm,
    config: {
      levels,
      subdivision: settings.subdivision,
      sound: settings.sound,
      volume: settings.volume / 100,
      countIn: settings.countIn,
      ...TRAINING_OFF,
    },
  });

  const setBpm = (value: number) => setBpmState(clampBpm(value));
  const onBeat = playing && pulse.subdivision === 0 && pulse.beat >= 0 && pulse.phase !== "silent";

  function handleTap() {
    const now = performance.now();
    const taps = tapsRef.current;
    if (taps.length && now - taps[taps.length - 1] > 2000) taps.length = 0;
    taps.push(now);
    if (taps.length > 6) taps.shift();
    if (!playing) click(taps.length === 1 ? 3 : 1);
    const next = bpmFromTaps(taps);
    if (next) setBpm(next);
    setTapping(true);
    window.setTimeout(() => setTapping(false), 120);
  }

  return (
    <>
      {settings.flash && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none fixed inset-0 z-[100] transition-opacity duration-75",
            onBeat ? (pulse.beat === 0 ? "bg-accent/30" : "bg-accent/14") : "opacity-0"
          )}
        />
      )}

      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <div className="text-center">
          <div
            className={cn(
              "font-display text-5xl font-bold tabular-nums tracking-[-0.03em] transition-colors duration-75",
              onBeat && pulse.beat === 0 ? "text-accent" : "text-text-primary"
            )}
          >
            {bpm}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            BPM · {initialTimeSignature}
            {pulse.phase === "count" && " · отсчёт"}
          </div>
        </div>

        <div className="w-full">
          <BeatCells
            levels={levels}
            pulse={pulse}
            subdivision={settings.subdivision}
            size="sm"
            onCycle={(i) =>
              setLevels((prev) => prev.map((l, j) => (j === i ? nextAccent(l) : l)))
            }
          />
        </div>

        <div className="flex items-center gap-3">
          <Button variant="default" size="icon" onClick={() => setBpm(bpm - 1)} aria-label="Медленнее">
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant={playing ? "accent" : "default"}
            size="lg"
            className="min-w-[100px]"
            onClick={() => (playing ? stop() : start())}
          >
            {playing ? "Стоп" : "Старт"}
          </Button>
          <Button variant="default" size="icon" onClick={() => setBpm(bpm + 1)} aria-label="Быстрее">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant={tapping ? "accent" : "default"}
            onClick={handleTap}
            className="text-xs"
          >
            <Hand className="h-3.5 w-3.5" />
            Тап
          </Button>
          <Button
            type="button"
            variant={settings.flash ? "accent" : "default"}
            onClick={() => updateSettings({ flash: !settings.flash })}
            className="text-xs"
            aria-pressed={settings.flash}
          >
            {settings.flash ? <Zap className="h-3.5 w-3.5" /> : <ZapOff className="h-3.5 w-3.5" />}
            Вспышка
          </Button>
          <select
            value={settings.sound}
            onChange={(e) => updateSettings({ sound: e.target.value as MetronomeSound })}
            className="h-9 rounded-lg border border-border bg-bg-3 px-2 text-xs outline-none focus:border-accent"
            aria-label="Звук"
          >
            {(Object.keys(METRONOME_SOUND_LABELS) as MetronomeSound[]).map((key) => (
              <option key={key} value={key}>
                {METRONOME_SOUND_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}

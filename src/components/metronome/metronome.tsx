"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getBeatsPerBar,
  METRONOME_SOUND_LABELS,
  playMetronomeBeat,
  TIME_SIGNATURES,
  type MetronomeSound,
} from "@/lib/metronome-sounds";
import { Hand, Minus, Plus, Zap, ZapOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const selectClass =
  "rounded-lg border border-border bg-bg-3 px-2 py-1.5 text-xs outline-none focus:border-accent";

const SCHEDULE_AHEAD_SEC = 0.12;
const SCHEDULER_INTERVAL_MS = 25;

export function Metronome({
  initialBpm = 120,
  initialTimeSignature = "4/4",
  compact,
}: {
  initialBpm?: number;
  initialTimeSignature?: string;
  compact?: boolean;
}) {
  const [bpm, setBpm] = useState(initialBpm);
  const [timeSignature, setTimeSignature] = useState(initialTimeSignature);
  const [sound, setSound] = useState<MetronomeSound>("classic");
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const [tapping, setTapping] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [flashStrong, setFlashStrong] = useState(false);

  const audioCtx = useRef<AudioContext | null>(null);
  const playingRef = useRef(false);
  const bpmRef = useRef(bpm);
  const soundRef = useRef(sound);
  const beatsPerBarRef = useRef(getBeatsPerBar(timeSignature));
  const beatNumberRef = useRef(0);
  const nextNoteTimeRef = useRef(0);
  const schedulerTimerRef = useRef<number | null>(null);
  const visualTimersRef = useRef<number[]>([]);
  const tapTimesRef = useRef<number[]>([]);
  const alignOnStartRef = useRef<{ beatNumber: number; nextTime: number } | null>(
    null
  );
  const screenFlashRef = useRef(false);
  const flashTimerRef = useRef<number | null>(null);

  const beatsPerBar = getBeatsPerBar(timeSignature);

  useEffect(() => {
    setBpm(initialBpm);
  }, [initialBpm]);

  useEffect(() => {
    setTimeSignature(initialTimeSignature);
  }, [initialTimeSignature]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  useEffect(() => {
    beatsPerBarRef.current = beatsPerBar;
  }, [beatsPerBar]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    screenFlashRef.current = screenFlash;
    if (!screenFlash) {
      setFlashOn(false);
    }
  }, [screenFlash]);

  const triggerFlash = useCallback((isDownbeat: boolean) => {
    if (!screenFlashRef.current) return;
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
    }
    setFlashStrong(isDownbeat);
    setFlashOn(true);
    flashTimerRef.current = window.setTimeout(() => {
      setFlashOn(false);
      flashTimerRef.current = null;
    }, isDownbeat ? 90 : 55);
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioCtx.current) {
      audioCtx.current = new AudioContext();
    }
    const ctx = audioCtx.current;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    return ctx;
  }, []);

  const clearVisualTimers = useCallback(() => {
    for (const id of visualTimersRef.current) {
      clearTimeout(id);
    }
    visualTimersRef.current = [];
  }, []);

  const scheduleBeat = useCallback(
    (when: number, beatIndex: number) => {
      const ctx = getAudioContext();
      const isDownbeat = beatIndex === 0;
      playMetronomeBeat(ctx, soundRef.current, isDownbeat, when);

      const delayMs = Math.max(0, (when - ctx.currentTime) * 1000);
      const timerId = window.setTimeout(() => {
        if (playingRef.current) {
          setBeat(beatIndex);
          triggerFlash(isDownbeat);
        }
      }, delayMs);
      visualTimersRef.current.push(timerId);
    },
    [getAudioContext, triggerFlash]
  );

  const scheduler = useCallback(() => {
    if (!playingRef.current) return;

    const ctx = getAudioContext();
    const secondsPerBeat = 60 / bpmRef.current;

    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
      const beatIndex = beatNumberRef.current % beatsPerBarRef.current;
      scheduleBeat(nextNoteTimeRef.current, beatIndex);
      nextNoteTimeRef.current += secondsPerBeat;
      beatNumberRef.current += 1;
    }

    schedulerTimerRef.current = window.setTimeout(scheduler, SCHEDULER_INTERVAL_MS);
  }, [getAudioContext, scheduleBeat]);

  const stopScheduler = useCallback(() => {
    if (schedulerTimerRef.current) {
      clearTimeout(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    clearVisualTimers();
    beatNumberRef.current = 0;
    setBeat(0);
  }, [clearVisualTimers]);

  const startScheduler = useCallback(
    (aligned?: { beatNumber: number; nextTime: number }) => {
      stopScheduler();
      const ctx = getAudioContext();
      if (aligned) {
        nextNoteTimeRef.current = aligned.nextTime;
        beatNumberRef.current = aligned.beatNumber;
      } else {
        nextNoteTimeRef.current = ctx.currentTime + 0.05;
        beatNumberRef.current = 0;
      }
      scheduler();
    },
    [getAudioContext, scheduler, stopScheduler]
  );

  useEffect(() => {
    if (playing) {
      const aligned = alignOnStartRef.current;
      alignOnStartRef.current = null;
      startScheduler(aligned ?? undefined);
    } else {
      stopScheduler();
      tapTimesRef.current = [];
    }

    return () => {
      if (schedulerTimerRef.current) {
        clearTimeout(schedulerTimerRef.current);
      }
      clearVisualTimers();
    };
  }, [playing, startScheduler, stopScheduler, clearVisualTimers]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
      audioCtx.current?.close();
    };
  }, []);

  function handleTap() {
    const ctx = getAudioContext();
    const now = performance.now();
    const times = tapTimesRef.current;

    if (times.length > 0 && now - times[times.length - 1] > 2000) {
      times.length = 0;
    }

    const tapBeatIndex = times.length % beatsPerBarRef.current;
    playMetronomeBeat(
      ctx,
      soundRef.current,
      tapBeatIndex === 0,
      ctx.currentTime
    );
    setBeat(tapBeatIndex);
    triggerFlash(tapBeatIndex === 0);

    times.push(now);
    if (times.length > 8) times.shift();

    let nextBpm = bpmRef.current;
    if (times.length >= 2) {
      let total = 0;
      for (let i = 1; i < times.length; i++) {
        total += times[i] - times[i - 1];
      }
      const avg = total / (times.length - 1);
      nextBpm = Math.round(60000 / avg);
      nextBpm = Math.min(240, Math.max(40, nextBpm));
      setBpm(nextBpm);
      bpmRef.current = nextBpm;
    }

    const intervalSec = 60 / nextBpm;

    if (!playingRef.current) {
      alignOnStartRef.current = {
        beatNumber: tapBeatIndex + 1,
        nextTime: ctx.currentTime + intervalSec,
      };
      setPlaying(true);
    }

    setTapping(true);
    window.setTimeout(() => setTapping(false), 120);
  }

  return (
    <>
      {screenFlash && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none fixed inset-0 z-[100] transition-opacity duration-75",
            flashOn
              ? flashStrong
                ? "bg-accent/30"
                : "bg-accent/14"
              : "opacity-0"
          )}
        />
      )}

      <div
        className={cn(
          "flex w-full flex-col items-center",
          compact ? "gap-3" : "gap-6"
        )}
      >
      <div className="text-center">
        <div
          className={cn(
            "font-mono font-medium tabular-nums text-accent",
            compact ? "text-4xl" : "text-6xl"
          )}
        >
          {bpm}
        </div>
        <div className="text-xs uppercase tracking-wider text-text-muted">
          BPM · {timeSignature}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <select
          value={timeSignature}
          onChange={(e) => setTimeSignature(e.target.value)}
          className={selectClass}
          aria-label="Размер"
        >
          {TIME_SIGNATURES.map((ts) => (
            <option key={ts} value={ts}>
              {ts}
            </option>
          ))}
        </select>
        <select
          value={sound}
          onChange={(e) => setSound(e.target.value as MetronomeSound)}
          className={selectClass}
          aria-label="Звук"
        >
          {(Object.keys(METRONOME_SOUND_LABELS) as MetronomeSound[]).map(
            (key) => (
              <option key={key} value={key}>
                {METRONOME_SOUND_LABELS[key]}
              </option>
            )
          )}
        </select>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          variant="default"
          size="icon"
          onClick={() => setBpm((b) => Math.max(40, b - 1))}
          aria-label="Медленнее"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant={playing ? "accent" : "default"}
          size="lg"
          className="min-w-[100px]"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? "Стоп" : "Старт"}
        </Button>
        <Button
          variant="default"
          size="icon"
          onClick={() => setBpm((b) => Math.min(240, b + 1))}
          aria-label="Быстрее"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant={tapping ? "accent" : "default"}
          onClick={handleTap}
          className={cn(compact ? "text-xs" : "text-sm")}
        >
          <Hand className="h-3.5 w-3.5" />
          Tap
        </Button>
        <Button
          type="button"
          variant={screenFlash ? "accent" : "default"}
          onClick={() => setScreenFlash((v) => !v)}
          className={cn(compact ? "text-xs" : "text-sm")}
          aria-pressed={screenFlash}
          aria-label={
            screenFlash ? "Отключить мигание экрана" : "Включить мигание экрана"
          }
        >
          {screenFlash ? (
            <Zap className="h-3.5 w-3.5" />
          ) : (
            <ZapOff className="h-3.5 w-3.5" />
          )}
          Вспышка
        </Button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: beatsPerBar }, (_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-md transition-all duration-75",
              compact ? "h-9 w-3" : "h-11 w-4",
              playing && beat === i
                ? "scale-110 bg-accent ring-2 ring-accent/40"
                : i === 0
                  ? "bg-accent/35"
                  : "bg-bg-3"
            )}
          />
        ))}
      </div>

      {!compact && (
        <input
          type="range"
          min={40}
          max={240}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-full max-w-xs accent-accent"
        />
      )}
      </div>
    </>
  );
}

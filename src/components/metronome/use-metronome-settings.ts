"use client";

import { isMetronomeSound, type MetronomeSound } from "@/lib/metronome-sounds";
import type { GapSettings, Subdivision, TrainerSettings } from "@/lib/metronome/rhythm";
import { useCallback, useSyncExternalStore } from "react";

export interface MetronomeSettings {
  sound: MetronomeSound;
  /** 0…100 */
  volume: number;
  subdivision: Subdivision;
  countIn: boolean;
  flash: boolean;
  trainer: TrainerSettings;
  gap: GapSettings;
}

export const DEFAULT_METRONOME_SETTINGS: MetronomeSettings = {
  sound: "classic",
  volume: 80,
  subdivision: 1,
  countIn: false,
  flash: false,
  trainer: { enabled: false, step: 2, everyBars: 4, maxBpm: 160 },
  gap: { enabled: false, playBars: 3, muteBars: 1 },
};

const STORAGE_KEY = "bandos.metronome.v1";
const listeners = new Set<() => void>();

let cachedRaw: string | null | undefined;
let cachedValue: MetronomeSettings = DEFAULT_METRONOME_SETTINGS;
/** Хранилище недоступно — настройки живут в памяти до перезагрузки. */
let memoryOnly = false;

function int(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : fallback;
}

/** Чужое или старое значение в localStorage не должно ломать метроном. */
function parse(raw: string | null): MetronomeSettings {
  if (!raw) return DEFAULT_METRONOME_SETTINGS;
  try {
    const v = JSON.parse(raw) as Partial<MetronomeSettings>;
    const d = DEFAULT_METRONOME_SETTINGS;
    const t: Partial<TrainerSettings> = v.trainer ?? {};
    const g: Partial<GapSettings> = v.gap ?? {};
    return {
      sound: isMetronomeSound(v.sound) ? v.sound : d.sound,
      volume: int(v.volume, 0, 100, d.volume),
      subdivision: int(v.subdivision, 1, 4, d.subdivision) as Subdivision,
      countIn: v.countIn === true,
      flash: v.flash === true,
      trainer: {
        enabled: t.enabled === true,
        step: int(t.step, 1, 20, d.trainer.step),
        everyBars: int(t.everyBars, 1, 32, d.trainer.everyBars),
        maxBpm: int(t.maxBpm, 30, 300, d.trainer.maxBpm),
      },
      gap: {
        enabled: g.enabled === true,
        playBars: int(g.playBars, 1, 16, d.gap.playBars),
        muteBars: int(g.muteBars, 1, 16, d.gap.muteBars),
      },
    };
  } catch {
    return DEFAULT_METRONOME_SETTINGS;
  }
}

function read(): MetronomeSettings {
  if (memoryOnly) return cachedValue;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // приватный режим / запрет хранилища — работаем на значениях по умолчанию
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parse(raw);
  }
  return cachedValue;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useMetronomeSettings() {
  const settings = useSyncExternalStore(subscribe, read, () => DEFAULT_METRONOME_SETTINGS);

  const update = useCallback((patch: Partial<MetronomeSettings>) => {
    const next = { ...read(), ...patch };
    const raw = JSON.stringify(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, raw);
    } catch {
      memoryOnly = true;
    }
    cachedRaw = raw;
    cachedValue = next;
    for (const l of listeners) l();
  }, []);

  return [settings, update] as const;
}

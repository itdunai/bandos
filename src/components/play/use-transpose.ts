"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Сдвиг тональности трека в «Играем» — у каждого свой, хранится в браузере
 * (работает офлайн). Ключ — пункт сет-листа: в другом сет-листе тот же трек
 * может звучать в другой тональности.
 */
const STORAGE_KEY = "bandos.play-transpose.v1";
const MAX_ENTRIES = 300;
const listeners = new Set<() => void>();

let cachedRaw: string | null | undefined;
let cachedMap: Record<string, number> = {};

function readMap(): Record<string, number> {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedMap;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed = raw ? (JSON.parse(raw) as unknown) : {};
      cachedMap = parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
    } catch {
      cachedMap = {};
    }
  }
  return cachedMap;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Сдвиг в полутонах, −11…+11. */
export function useTranspose(trackId: string) {
  const semitones = useSyncExternalStore(
    subscribe,
    () => {
      const v = readMap()[trackId];
      return typeof v === "number" && Number.isInteger(v) ? v : 0;
    },
    () => 0
  );

  const set = useCallback(
    (value: number) => {
      // −12/+12 — та же тональность: держим в пределах октавы
      const next = ((value % 12) + 12) % 12;
      const normalized = next > 6 ? next - 12 : next;
      const map = { ...readMap() };
      if (normalized === 0) delete map[trackId];
      else map[trackId] = normalized;
      // Старые записи не копим бесконечно
      const keys = Object.keys(map);
      if (keys.length > MAX_ENTRIES) delete map[keys[0]];
      const raw = JSON.stringify(map);
      try {
        window.localStorage.setItem(STORAGE_KEY, raw);
      } catch {
        // без хранилища сдвиг живёт до перезагрузки
      }
      cachedRaw = raw;
      cachedMap = map;
      for (const l of listeners) l();
    },
    [trackId]
  );

  return [semitones, set] as const;
}

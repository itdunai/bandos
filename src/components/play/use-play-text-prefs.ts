"use client";

import { savePlayTextPrefs } from "@/app/actions/play-prefs";
import {
  DEFAULT_PLAY_TEXT_PREFS,
  parsePlayTextPrefs,
  type PlayTextPrefs,
} from "@/lib/play/text-prefs";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

const STORAGE_KEY = "bandos.play-text.v1";
const SAVE_DELAY_MS = 800;
const listeners = new Set<() => void>();

let cachedRaw: string | null | undefined;
let cachedValue: PlayTextPrefs = DEFAULT_PLAY_TEXT_PREFS;
let memoryOnly = false;

function read(): PlayTextPrefs {
  if (memoryOnly) return cachedValue;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // приватный режим — значения по умолчанию
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedValue = parsePlayTextPrefs(raw ? JSON.parse(raw) : null);
    } catch {
      cachedValue = DEFAULT_PLAY_TEXT_PREFS;
    }
  }
  return cachedValue;
}

function write(next: PlayTextPrefs) {
  const raw = JSON.stringify(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    memoryOnly = true;
  }
  cachedRaw = raw;
  cachedValue = next;
  for (const l of listeners) l();
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

/**
 * Размер, выравнивание и шрифт текста в «Играем». Хранится в браузере (работает
 * офлайн) и в профиле (переезжает на другие устройства); побеждает более свежее.
 * `serverPrefs` — из профиля, нет при офлайн-открытии.
 */
export function usePlayTextPrefs(serverPrefs?: unknown) {
  const prefs = useSyncExternalStore(subscribe, read, () => DEFAULT_PLAY_TEXT_PREFS);
  const saveTimer = useRef<number | null>(null);

  // Профиль новее браузера (меняли на другом устройстве) — берём его;
  // браузер новее (меняли офлайн) — досылаем в профиль
  useEffect(() => {
    if (!serverPrefs) return;
    const fromServer = parsePlayTextPrefs(serverPrefs);
    const local = read();
    if (fromServer.updatedAt > local.updatedAt) write(fromServer);
    else if (local.updatedAt > fromServer.updatedAt) void savePlayTextPrefs(local).catch(() => {});
  }, [serverPrefs]);

  useEffect(
    () => () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    },
    []
  );

  const update = useCallback((patch: Partial<Omit<PlayTextPrefs, "updatedAt">>) => {
    const next = parsePlayTextPrefs({ ...read(), ...patch, updatedAt: Date.now() });
    write(next);
    // Нажимают «A+» несколько раз подряд — в профиль уходит одно сохранение
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      if (navigator.onLine) void savePlayTextPrefs(next).catch(() => {});
    }, SAVE_DELAY_MS);
  }, []);

  return [prefs, update] as const;
}

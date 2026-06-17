import type { PlayTrack } from "@/components/play/play-mode";
import type { Instrument } from "@/types/database";

export const PLAY_OFFLINE_CACHE_VERSION = 1;

export interface PlayOfflineSession {
  version: typeof PLAY_OFFLINE_CACHE_VERSION;
  bandSlug: string;
  setlistId: string;
  setlistName: string;
  tracks: PlayTrack[];
  instrument: Instrument;
  cachedAt: string;
}

const STORAGE_PREFIX = "bandos:play:";

function storageKey(bandSlug: string, setlistId: string) {
  return `${STORAGE_PREFIX}${bandSlug}:${setlistId}`;
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function savePlaySession(session: PlayOfflineSession) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(
      storageKey(session.bandSlug, session.setlistId),
      JSON.stringify(session)
    );
  } catch {
    // Quota exceeded or private mode — ignore
  }
}

export function loadPlaySession(
  bandSlug: string,
  setlistId: string
): PlayOfflineSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(storageKey(bandSlug, setlistId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlayOfflineSession;
    if (parsed.version !== PLAY_OFFLINE_CACHE_VERSION) return null;
    if (parsed.bandSlug !== bandSlug || parsed.setlistId !== setlistId) return null;
    if (!Array.isArray(parsed.tracks)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function listPlaySessionsForBand(bandSlug: string): PlayOfflineSession[] {
  if (!isBrowser()) return [];
  const prefix = `${STORAGE_PREFIX}${bandSlug}:`;
  const sessions: PlayOfflineSession[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(prefix)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as PlayOfflineSession;
      if (parsed.version !== PLAY_OFFLINE_CACHE_VERSION) continue;
      sessions.push(parsed);
    }
  } catch {
    return [];
  }

  return sessions.sort(
    (a, b) => new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime()
  );
}

export function formatPlayCachedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

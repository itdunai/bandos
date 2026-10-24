"use client";

import { PlayMode } from "@/components/play/play-mode";
import type { PlayTrack } from "@/components/play/play-mode";
import {
  formatPlayCachedAt,
  savePlaySession,
  type PlayOfflineSession,
} from "@/lib/play/offline-cache";
import type { Instrument } from "@/types/database";
import { CloudOff, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

export function PlaySetlistShell({
  bandSlug,
  setlistId,
  setlistName,
  tracks,
  instrument,
}: {
  bandSlug: string;
  setlistId: string;
  setlistName: string;
  tracks: PlayTrack[];
  instrument: Instrument;
}) {
  const [isOnline, setIsOnline] = useState(true);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  // Режим игры — полноэкранный оверлей: документ под ним не должен скроллиться,
  // иначе на iOS жест «перетекает» на body и внутренняя прокрутка залипает.
  useEffect(() => {
    const root = document.documentElement;
    const prev = {
      overflow: root.style.overflow,
      overscroll: root.style.overscrollBehavior,
      bodyOverflow: document.body.style.overflow,
    };
    root.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    document.body.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev.overflow;
      root.style.overscrollBehavior = prev.overscroll;
      document.body.style.overflow = prev.bodyOverflow;
    };
  }, []);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    const session: PlayOfflineSession = {
      version: 1,
      bandSlug,
      setlistId,
      setlistName,
      tracks,
      instrument,
      cachedAt: new Date().toISOString(),
    };
    savePlaySession(session);
    setCachedAt(session.cachedAt);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, [bandSlug, setlistId, setlistName, tracks, instrument]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={`shrink-0 border-b px-4 py-2 text-center text-[11px] ${
          isOnline
            ? "border-border bg-bg-2 text-text-muted"
            : "border-amber/30 bg-amber/10 text-amber"
        }`}
      >
        {isOnline ? (
          <span className="inline-flex items-center justify-center gap-1.5">
            <Wifi className="h-3 w-3" />
            {cachedAt
              ? `Сохранено для офлайна · ${formatPlayCachedAt(cachedAt)}`
              : "Сохранение для офлайна…"}
          </span>
        ) : (
          <span className="inline-flex items-center justify-center gap-1.5">
            <CloudOff className="h-3 w-3" />
            Офлайн — показываем сохранённый сет-лист
          </span>
        )}
      </div>
      <PlayMode
        setlistName={setlistName}
        tracks={tracks}
        instrument={instrument}
      />
    </div>
  );
}

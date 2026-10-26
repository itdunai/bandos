"use client";

import { PlayMode } from "@/components/play/play-mode";
import type { PlayTrack } from "@/components/play/play-mode";
import {
  formatPlayCachedAt,
  savePlaySession,
  type PlayOfflineSession,
} from "@/lib/play/offline-cache";
import type { Instrument } from "@/types/database";
import { useWakeLock } from "@/lib/use-wake-lock";
import { bandPath } from "@/lib/paths";
import { ArrowLeft, CloudOff, Sun, Wifi } from "lucide-react";
import Link from "next/link";
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
  const screenAwake = useWakeLock();

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
        className={`flex shrink-0 items-center gap-2 border-b px-2 py-1.5 text-xs ${
          isOnline
            ? "border-border bg-bg-2 text-text-muted"
            : "border-amber/30 bg-amber/10 text-amber"
        }`}
      >
        <Link
          href={bandPath(bandSlug, "play", ...(isOnline ? [] : ["offline"]))}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Link>
        <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 truncate">
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {cachedAt
                  ? `Сохранено для офлайна · ${formatPlayCachedAt(cachedAt)}`
                  : "Сохранение для офлайна…"}
              </span>
            </>
          ) : (
            <>
              <CloudOff className="h-3 w-3 shrink-0" />
              <span className="truncate">Офлайн — показываем сохранённый сет-лист</span>
            </>
          )}
          {screenAwake && <ScreenAwakeHint />}
        </span>
        {/* Противовес кнопке «Назад», чтобы статус оставался по центру */}
        <span className="w-[76px] shrink-0" aria-hidden />
      </div>
      <PlayMode
        setlistName={setlistName}
        tracks={tracks}
        instrument={instrument}
      />
    </div>
  );
}

function ScreenAwakeHint() {
  return (
    <span className="hidden shrink-0 items-center gap-1 sm:inline-flex" title="Экран не погаснет, пока открыт режим «Играем»">
      <span aria-hidden>·</span>
      <Sun className="h-3 w-3" />
      экран не гаснет
    </span>
  );
}

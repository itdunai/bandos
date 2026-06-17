"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import {
  listPlaySessionsForBand,
  loadPlaySession,
} from "@/lib/play/offline-cache";
import { bandPath } from "@/lib/paths";
import { CloudOff, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { PlaySetlistShell } from "./play-setlist-shell";

export function PlayFromCache({
  bandSlug,
  setlistId,
}: {
  bandSlug: string;
  setlistId: string;
}) {
  const [session, setSession] = useState(
    () => loadPlaySession(bandSlug, setlistId)
  );

  useEffect(() => {
    setSession(loadPlaySession(bandSlug, setlistId));
  }, [bandSlug, setlistId]);

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-6">
        <EmptyState
          icon={<CloudOff className="h-8 w-8" />}
          title="Нет сохранённого сет-листа"
          description="Откройте сет-лист онлайн хотя бы один раз — тогда он будет доступен без сети."
          action={
            <Link href={bandPath(bandSlug, "play")}>
              <Button variant="accent">К выбору сет-листов</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <PlaySetlistShell
        bandSlug={session.bandSlug}
        setlistId={session.setlistId}
        setlistName={session.setlistName}
        tracks={session.tracks}
        instrument={session.instrument}
      />
    </div>
  );
}

export function PlayOfflineList({ bandSlug }: { bandSlug: string }) {
  const [sessions, setSessions] = useState(() =>
    listPlaySessionsForBand(bandSlug)
  );

  useEffect(() => {
    setSessions(listPlaySessionsForBand(bandSlug));
  }, [bandSlug]);

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={<CloudOff className="h-8 w-8" />}
        title="Пока ничего не сохранено"
        description="Откройте нужный сет-лист в режиме «Играем» при подключении к интернету."
        action={
          <Link href={bandPath(bandSlug, "play")}>
            <Button variant="accent">К сет-листам</Button>
          </Link>
        }
      />
    );
  }

  return (
    <ul className="space-y-2">
      {sessions.map((session) => (
        <li key={session.setlistId}>
          <Link
            href={`${bandPath(bandSlug, "play", session.setlistId)}?offline=1`}
            className="flex items-center gap-3 rounded-xl border border-border bg-bg-2 p-4 transition-colors hover:border-accent"
          >
            <Play className="h-4 w-4 shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">{session.setlistName}</div>
              <div className="text-xs text-text-muted">
                {session.tracks.length} треков · сохранено{" "}
                {new Date(session.cachedAt).toLocaleString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

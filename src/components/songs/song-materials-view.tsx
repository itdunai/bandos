"use client";

import { Tabs } from "@/components/ui/tabs";

export function SongMaterialsView({
  chords,
  tabs,
  lyrics,
}: {
  chords?: string;
  tabs?: string;
  lyrics?: string;
}) {
  const tabsList = [
    chords
      ? {
          id: "chords",
          label: "Аккорды",
          content: (
            <pre className="font-mono text-sm text-accent whitespace-pre-wrap">
              {chords}
            </pre>
          ),
        }
      : null,
    tabs
      ? {
          id: "tabs",
          label: "Табы",
          content: (
            <pre className="font-mono text-sm text-text-secondary whitespace-pre-wrap">
              {tabs}
            </pre>
          ),
        }
      : null,
    lyrics
      ? {
          id: "lyrics",
          label: "Текст",
          content: (
            <pre className="text-sm text-text-secondary whitespace-pre-wrap">
              {lyrics}
            </pre>
          ),
        }
      : null,
  ].filter(Boolean) as { id: string; label: string; content: React.ReactNode }[];

  if (!tabsList.length) return null;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <Tabs tabs={tabsList} />
    </div>
  );
}

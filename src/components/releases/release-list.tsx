"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { bandPath } from "@/lib/paths";
import { formatDate } from "@/lib/utils";
import {
  RELEASE_PLATFORM_LABELS,
  type Release,
  type ReleaseLink,
  type ReleasePlatform,
} from "@/types/database";
import { Disc3, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export type ReleaseListItem = Release & {
  links: Pick<ReleaseLink, "platform" | "url">[];
  song_title?: string | null;
};

export function ReleaseList({
  releases,
  bandSlug,
  canCreate = false,
}: {
  releases: ReleaseListItem[];
  bandSlug: string;
  canCreate?: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return releases;
    return releases.filter((release) => {
      const haystack = [
        release.title,
        release.song_title,
        ...release.links.map((l) => RELEASE_PLATFORM_LABELS[l.platform as ReleasePlatform]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [releases, query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 && !canCreate ? (
        <p className="rounded-xl border border-border bg-bg-2 px-4 py-10 text-center text-sm text-text-secondary">
          Релизов пока нет
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {filtered.map((release) => (
            <Link
              key={release.id}
              href={bandPath(bandSlug, "releases", release.id)}
              className="group overflow-hidden rounded-xl border border-border bg-bg-2 transition-colors hover:border-accent"
            >
              <div className="aspect-square bg-bg-3">
                {release.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={release.cover_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-text-muted">
                    <Disc3 className="h-10 w-10 opacity-40" />
                  </div>
                )}
              </div>
              <div className="space-y-2 p-3">
                <div>
                  <h3 className="truncate font-medium group-hover:text-accent">
                    {release.title}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {formatDate(release.released_at, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {release.links.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {release.links.slice(0, 4).map((link) => (
                      <Badge key={link.platform} variant="purple">
                        {RELEASE_PLATFORM_LABELS[link.platform as ReleasePlatform]}
                      </Badge>
                    ))}
                    {release.links.length > 4 && (
                      <Badge variant="purple">+{release.links.length - 4}</Badge>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}

          {canCreate && !query.trim() && (
            <Link
              href={bandPath(bandSlug, "releases", "new")}
              className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-bg-2 text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm">Добавить релиз</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

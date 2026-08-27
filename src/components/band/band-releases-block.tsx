import { Badge } from "@/components/ui/badge";
import type { ReleaseListItem } from "@/components/releases/release-list";
import { bandPath } from "@/lib/paths";
import { formatDate } from "@/lib/utils";
import {
  RELEASE_PLATFORM_LABELS,
  type ReleasePlatform,
} from "@/types/database";
import { Disc3 } from "lucide-react";
import Link from "next/link";

export function BandReleasesBlock({
  releases,
  bandSlug,
}: {
  releases: ReleaseListItem[];
  bandSlug: string;
}) {
  if (releases.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-bg-2 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Disc3 className="h-4 w-4 text-text-muted" />
          Релизы
        </h3>
        <Link
          href={bandPath(bandSlug, "releases")}
          className="text-xs text-accent hover:underline"
        >
          Все релизы
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {releases.map((release) => (
          <Link
            key={release.id}
            href={bandPath(bandSlug, "releases", release.id)}
            className="group overflow-hidden rounded-lg border border-border bg-bg-3 transition-colors hover:border-accent"
          >
            <div className="aspect-square bg-bg">
              {release.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={release.cover_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-text-muted">
                  <Disc3 className="h-7 w-7 opacity-40" />
                </div>
              )}
            </div>
            <div className="space-y-1 p-2">
              <p className="truncate text-sm font-medium group-hover:text-accent">
                {release.title}
              </p>
              <p className="text-[10px] text-text-muted">
                {formatDate(release.released_at, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              {release.links.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {release.links.slice(0, 2).map((link) => (
                    <Badge key={link.platform} variant="purple">
                      {
                        RELEASE_PLATFORM_LABELS[
                          link.platform as ReleasePlatform
                        ]
                      }
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

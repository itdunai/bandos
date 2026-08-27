import type { ReleaseListItem } from "@/components/releases/release-list";
import { bandPath } from "@/lib/paths";
import { sanitizeHref } from "@/lib/safe-url";
import { formatDate } from "@/lib/utils";
import { Disc3 } from "lucide-react";
import Link from "next/link";

export function BandReleasesBlock({
  releases,
  bandSlug,
  variant = "internal",
}: {
  releases: ReleaseListItem[];
  bandSlug: string;
  /** internal — ссылки в BandOS; public — внешние ссылки на площадки */
  variant?: "internal" | "public";
}) {
  if (releases.length === 0) return null;

  const isPublic = variant === "public";

  return (
    <div className="rounded-xl border border-border bg-bg-2 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Disc3 className="h-4 w-4 text-text-muted" />
          Релизы
        </h3>
        {!isPublic && (
          <Link
            href={bandPath(bandSlug, "releases")}
            className="text-xs text-accent hover:underline"
          >
            Все релизы
          </Link>
        )}
      </div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {releases.map((release) => {
          const firstExternal = release.links
            .map((l) => sanitizeHref(l.url))
            .find(Boolean);
          const href = isPublic
            ? firstExternal
            : bandPath(bandSlug, "releases", release.id);

          const body = (
            <>
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
                    <Disc3 className="h-5 w-5 opacity-40" />
                  </div>
                )}
              </div>
              <div className="space-y-0.5 p-1.5">
                <p className="truncate text-[11px] font-medium group-hover:text-accent sm:text-xs">
                  {release.title}
                </p>
                <p className="truncate text-[9px] text-text-muted sm:text-[10px]">
                  {formatDate(release.released_at, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </>
          );

          const className =
            "group overflow-hidden rounded-lg border border-border bg-bg-3 transition-colors hover:border-accent";

          if (!href) {
            return (
              <div key={release.id} className={className}>
                {body}
              </div>
            );
          }

          if (isPublic) {
            return (
              <a
                key={release.id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {body}
              </a>
            );
          }

          return (
            <Link key={release.id} href={href} className={className}>
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

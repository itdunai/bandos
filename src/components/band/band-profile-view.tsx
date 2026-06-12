import { ShareLinkButton } from "@/components/band/share-link-button";
import { sanitizeHref } from "@/lib/safe-url";
import type { Band, SocialLinks } from "@/types/database";
import { SOCIAL_LABELS } from "@/types/database";
import { ExternalLink, Music, Users } from "lucide-react";

export function BandProfileView({
  band,
  tracksCount,
  membersCount,
  riderSharePath,
}: {
  band: Band;
  tracksCount: number;
  membersCount: number;
  riderSharePath: string;
}) {
  const links = (band.social_links ?? {}) as SocialLinks;
  const linkEntries = Object.entries(links)
    .map(([key, url]) => [key, sanitizeHref(url)] as const)
    .filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-bg-2 p-4">
        <h2 className="text-lg font-medium">{band.name}</h2>
        {band.genre && (
          <p className="mt-1 text-sm text-accent">{band.genre}</p>
        )}
        {band.description && (
          <p className="mt-3 text-sm text-text-secondary whitespace-pre-wrap">
            {band.description}
          </p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg bg-bg-3 px-3 py-2 text-sm">
            <Music className="h-4 w-4 text-text-muted" />
            <span>{tracksCount} треков</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-bg-3 px-3 py-2 text-sm">
            <Users className="h-4 w-4 text-text-muted" />
            <span>{membersCount} участников</span>
          </div>
        </div>
      </div>

      {band.tech_rider && (
        <div className="rounded-xl border border-border bg-bg-2 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium">Техрайдер</h3>
            {band.rider_public && (
              <ShareLinkButton path={riderSharePath} label="Поделиться" />
            )}
          </div>
          <pre className="text-xs text-text-secondary whitespace-pre-wrap font-sans">
            {band.tech_rider}
          </pre>
        </div>
      )}

      {linkEntries.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-2 p-4">
          <h3 className="mb-2 text-sm font-medium">Ссылки</h3>
          <ul className="space-y-1.5">
            {linkEntries.map(([key, url]) => (
              <li key={key}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {SOCIAL_LABELS[key as keyof SocialLinks] ?? key}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import { BandContactsBlock } from "@/components/band/band-contacts-block";
import { BandReleasesBlock } from "@/components/band/band-releases-block";
import { PublicPageShare } from "@/components/band/public-page-share";
import { ShareLinkButton } from "@/components/band/share-link-button";
import type { ReleaseListItem } from "@/components/releases/release-list";
import { PhotoGallery } from "@/components/ui/image-lightbox";
import { FormattedText } from "@/components/ui/minimal-editor";
import { SafeMediaImage } from "@/components/ui/safe-media-image";
import { sanitizeHref } from "@/lib/safe-url";
import type { Band, BandContact, SocialLinks } from "@/types/database";
import { SOCIAL_LABELS } from "@/types/database";
import { ExternalLink, MapPin, Music, Users } from "lucide-react";

export function BandProfileView({
  band,
  tracksCount,
  membersCount,
  releases,
  riderSharePath,
}: {
  band: Band;
  tracksCount: number;
  membersCount: number;
  releases: ReleaseListItem[];
  riderSharePath: string;
}) {
  const links = (band.social_links ?? {}) as SocialLinks;
  const linkEntries = Object.entries(links)
    .map(([key, url]) => [key, sanitizeHref(url)] as const)
    .filter((entry): entry is [string, string] => Boolean(entry[1]));

  const photos = Array.isArray(band.photos) ? band.photos : [];
  const contacts = (band.contacts ?? []) as BandContact[];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-bg-2 p-4">
        <div className="flex items-start gap-4">
          {band.logo_url ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border">
              <SafeMediaImage
                src={band.logo_url}
                alt={band.name}
                fill
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-medium">{band.name}</h2>
            {(band.genre || band.city) && (
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                {band.genre && <span className="text-accent">{band.genre}</span>}
                {band.city && (
                  <span className="flex items-center gap-1 text-text-secondary">
                    <MapPin className="h-3.5 w-3.5" />
                    {band.city}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {band.description && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-text-secondary">
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

      <PublicPageShare path={riderSharePath} />

      <BandReleasesBlock releases={releases} bandSlug={band.slug} />

      <BandContactsBlock contacts={contacts} />

      {photos.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-2 p-4">
          <PhotoGallery photos={photos} title="Фото" />
        </div>
      )}

      {band.tech_rider && (
        <div className="rounded-xl border border-border bg-bg-2 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium">Техрайдер</h3>
            {band.rider_public && (
              <ShareLinkButton path={riderSharePath} label="Поделиться" />
            )}
          </div>
          <FormattedText text={band.tech_rider} />
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

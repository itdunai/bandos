import { BandContactsBlock } from "@/components/band/band-contacts-block";
import { BandReleasesBlock } from "@/components/band/band-releases-block";
import { PublicPageShare } from "@/components/band/public-page-share";
import { ShareLinkButton } from "@/components/band/share-link-button";
import type { ReleaseListItem } from "@/components/releases/release-list";
import { PhotoGallery } from "@/components/ui/image-lightbox";
import { FormattedText } from "@/components/ui/minimal-editor";
import { SafeMediaImage } from "@/components/ui/safe-media-image";
import type { Band, BandContact } from "@/types/database";
import { getSocialLinkList } from "@/lib/band/social-links";
import { ExternalLink, MapPin } from "lucide-react";

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-bg-2 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

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
  const links = getSocialLinkList(band.social_links);
  const photos = Array.isArray(band.photos) ? band.photos : [];
  const contacts = (band.contacts ?? []) as BandContact[];

  const stats = [
    { value: tracksCount, label: plural(tracksCount, "трек", "трека", "треков") },
    { value: membersCount, label: plural(membersCount, "участник", "участника", "участников") },
    { value: releases.length, label: plural(releases.length, "релиз", "релиза", "релизов") },
  ];

  return (
    <div className="space-y-5">
      {/* Карточка группы */}
      <section className="rounded-xl border border-border bg-bg-2 p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {band.logo_url ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border sm:h-24 sm:w-24">
              <SafeMediaImage src={band.logo_url} alt={band.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-accent font-display text-2xl font-bold text-accent-ink sm:h-24 sm:w-24 sm:text-3xl">
              {initials(band.name)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="heading-poster text-2xl sm:text-[32px]">{band.name}</h2>
            {(band.genre || band.city) && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {band.genre && <span className="font-medium text-accent">{band.genre}</span>}
                {band.city && (
                  <span className="flex items-center gap-1 text-text-secondary">
                    <MapPin className="h-3.5 w-3.5" />
                    {band.city}
                  </span>
                )}
              </div>
            )}
            {band.description && (
              <p className="mt-3 max-w-3xl whitespace-pre-wrap text-[15px] leading-relaxed text-text-secondary">
                {band.description}
              </p>
            )}
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
          {stats.map((s) => (
            <div key={s.label} className="bg-bg-2 px-3 py-3 sm:px-5">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-2xl font-bold leading-none tabular-nums sm:text-[28px]">
                {s.value}
              </dd>
              <div className="mt-1.5 text-xs text-text-muted">{s.label}</div>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Основное содержимое */}
        <div className="flex min-w-0 flex-col gap-5">
          {photos.length > 0 && (
            <section className="rounded-xl border border-border bg-bg-2 p-4 sm:p-5">
              <PhotoGallery photos={photos} title="Фото" />
            </section>
          )}

          <BandReleasesBlock releases={releases} bandSlug={band.slug} />

          {band.tech_rider && (
            <Section
              title="Техрайдер"
              action={
                band.rider_public ? (
                  <ShareLinkButton path={riderSharePath} label="Поделиться" />
                ) : undefined
              }
            >
              <FormattedText text={band.tech_rider} />
            </Section>
          )}
        </div>

        {/* Боковая колонка */}
        <div className="flex min-w-0 flex-col gap-5">
          <PublicPageShare path={riderSharePath} />

          <BandContactsBlock contacts={contacts} />

          {links.length > 0 && (
            <Section title="Соцсети и ссылки">
              <ul className="flex flex-wrap gap-2">
                {links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-3 px-3 py-1.5 text-sm text-accent transition-colors hover:border-accent"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

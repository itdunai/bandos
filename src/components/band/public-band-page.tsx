import { BandContactsBlock } from "@/components/band/band-contacts-block";
import { BandReleasesBlock } from "@/components/band/band-releases-block";
import { BookingForm } from "@/components/band/booking-form";
import { ScrollToHash } from "@/components/band/scroll-to-hash";
import type { ReleaseListItem } from "@/components/releases/release-list";
import { PhotoGallery } from "@/components/ui/image-lightbox";
import { FormattedText } from "@/components/ui/minimal-editor";
import { SafeMediaImage } from "@/components/ui/safe-media-image";
import { getSocialLinkList } from "@/lib/band/social-links";
import { formatDuration } from "@/lib/utils";
import {
  SONG_TYPE_LABELS,
  type ReleasePlatform,
  type BandContact,
  type SocialLinks,
  type SongType,
} from "@/types/database";
import { ArrowLeft, ExternalLink, ListMusic, MapPin, Music, Users } from "lucide-react";
import Link from "next/link";
import { SiteLogo } from "@/components/brand/site-logo";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, bandPageDescription } from "@/lib/seo";

interface PublicSong {
  title: string;
  song_type: SongType;
  duration_sec: number | null;
}

interface PublicRelease {
  id: string;
  title: string;
  released_at: string;
  cover_url: string | null;
  links: { platform: ReleasePlatform; url: string }[] | null;
}

export interface PublicBandPageData {
  name: string;
  slug: string;
  description: string | null;
  genre: string | null;
  city: string | null;
  logo_url: string | null;
  photos: string[];
  rider_public: boolean;
  repertoire_public: boolean;
  accept_bookings?: boolean;
  tech_rider: string | null;
  social_links: SocialLinks;
  contacts?: BandContact[];
  tracks_count: number;
  members_count: number;
  songs: PublicSong[];
  releases?: PublicRelease[];
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/** schema.org: MusicGroup + хлебные крошки. */
function bandJsonLd(band: PublicBandPageData, sameAs: string[], songs: PublicSong[]) {
  const url = absoluteUrl(`/rider/${band.slug}`);
  const logo = band.logo_url?.startsWith("/") ? absoluteUrl(band.logo_url) : band.logo_url;
  return [
    {
      "@context": "https://schema.org",
      "@type": "MusicGroup",
      "@id": `${url}#band`,
      name: band.name,
      url,
      description: bandPageDescription(band),
      ...(band.genre ? { genre: band.genre } : {}),
      ...(band.city
        ? { location: { "@type": "Place", name: band.city, address: { "@type": "PostalAddress", addressLocality: band.city } } }
        : {}),
      ...(logo ? { logo, image: logo } : {}),
      ...(sameAs.length ? { sameAs } : {}),
      ...(songs.length
        ? {
            track: songs.slice(0, 50).map((s) => ({
              "@type": "MusicRecording",
              name: s.title,
              ...(s.duration_sec
                ? { duration: `PT${Math.floor(s.duration_sec / 60)}M${s.duration_sec % 60}S` }
                : {}),
            })),
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Каталог групп", item: absoluteUrl("/#catalog") },
        { "@type": "ListItem", position: 3, name: band.name, item: url },
      ],
    },
  ];
}

export function PublicBandPage({ band }: { band: PublicBandPageData }) {
  const links = getSocialLinkList(band.social_links);
  const songs = band.songs ?? [];
  const photos = Array.isArray(band.photos) ? band.photos : [];
  const showRider = band.rider_public;
  const showRepertoire = band.repertoire_public;
  const releases: ReleaseListItem[] = (band.releases ?? []).map((r) => ({
    id: r.id,
    band_id: "",
    song_id: "",
    title: r.title,
    released_at: r.released_at,
    cover_url: r.cover_url,
    notes: null,
    links: r.links ?? [],
  }));
  const contacts = band.contacts ?? [];

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg text-text-primary">
      <ScrollToHash />
      <JsonLd data={bandJsonLd(band, links.map((l) => l.url), songs)} />

      <header className="sticky top-0 z-30 border-b border-border/80 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" aria-label="BandOS — на главную" className="flex shrink-0 items-center">
            <SiteLogo className="h-6 sm:h-7" />
          </Link>
          <Link
            href="/#catalog"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-3 hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Каталог групп
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <nav aria-label="Навигация" className="mb-5 text-xs text-text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-text-primary">Главная</Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/#catalog" className="hover:text-text-primary">Каталог групп</Link>
            </li>
            <li aria-hidden>/</li>
            <li className="truncate text-text-secondary" aria-current="page">{band.name}</li>
          </ol>
        </nav>

        <section className="mb-8 rounded-xl border border-border bg-bg-2 p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {band.logo_url ? (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border sm:h-24 sm:w-24">
                <SafeMediaImage src={band.logo_url} alt={`Логотип группы ${band.name}`} fill className="object-cover" />
              </div>
            ) : (
              <div
                aria-hidden
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-accent font-display text-2xl font-bold text-accent-ink sm:h-24 sm:w-24 sm:text-3xl"
              >
                {band.name
                  .split(/\s+/)
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="heading-poster text-2xl sm:text-[34px]">{band.name}</h1>
              {(band.genre || band.city) && (
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  {band.genre && <span className="font-medium text-accent">{band.genre}</span>}
                  {band.city && (
                    <span className="flex items-center gap-1 text-text-secondary">
                      <MapPin className="h-3.5 w-3.5" />
                      {band.city}
                    </span>
                  )}
                </p>
              )}
              {band.description && (
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-text-secondary">
                  {band.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <Music className="h-4 w-4" />
                  {band.tracks_count} {plural(band.tracks_count, "трек", "трека", "треков")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {band.members_count} {plural(band.members_count, "участник", "участника", "участников")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {band.accept_bookings && (
          <div id="booking" className="mb-8 scroll-mt-6">
            <BookingForm bandSlug={band.slug} bandName={band.name} />
          </div>
        )}

        {photos.length > 0 && (
          <div className="mb-8">
            <PhotoGallery photos={photos} title="Фото" />
          </div>
        )}

        {releases.length > 0 && (
          <div className="mb-8">
            <BandReleasesBlock
              releases={releases}
              bandSlug={band.slug}
              variant="public"
            />
          </div>
        )}

        {contacts.length > 0 && (
          <div className="mb-8">
            <BandContactsBlock contacts={contacts} />
          </div>
        )}

        {links.length > 0 && (
          <section className="mb-8 rounded-xl border border-border bg-bg-2 p-5">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide">Соцсети и ссылки</h2>
            <ul className="flex flex-wrap gap-2">
              {links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-3 px-3 py-1.5 text-sm text-accent transition-colors hover:border-accent"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {showRider && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-muted">
              Техрайдер
            </h2>
            {band.tech_rider ? (
              <div className="rounded-xl border border-border bg-bg-2 p-5">
                <FormattedText text={band.tech_rider} />
              </div>
            ) : (
              <p className="text-sm text-text-muted">Техрайдер пока не заполнен.</p>
            )}
          </section>
        )}

        {showRepertoire && (
          <section id="repertoire" className="scroll-mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-text-muted">
              <ListMusic className="h-4 w-4" />
              Репертуар
            </h2>
            <p className="mb-4 text-sm text-text-secondary">
              {songs.length} треков
            </p>

            {songs.length === 0 ? (
              <p className="text-sm text-text-muted">Репертуар пока пуст.</p>
            ) : (
              <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                      <th className="px-4 py-3 font-medium">Название</th>
                      <th className="px-4 py-3 font-medium">Тип</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Длительность
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {songs.map((song, i) => (
                      <tr
                        key={`${song.title}-${i}`}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="px-4 py-3 font-medium">
                          <span className="flex items-center gap-2">
                            <Music className="h-3.5 w-3.5 shrink-0 text-accent" />
                            {song.title}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {SONG_TYPE_LABELS[song.song_type]}
                        </td>
                        <td className="px-4 py-3 text-right text-text-secondary">
                          {formatDuration(song.duration_sec)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

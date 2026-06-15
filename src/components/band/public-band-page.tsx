import { ScrollToHash } from "@/components/band/scroll-to-hash";
import { sanitizeHref } from "@/lib/safe-url";
import { formatDuration } from "@/lib/utils";
import { SOCIAL_LABELS, SONG_TYPE_LABELS, type SocialLinks, type SongType } from "@/types/database";
import { ExternalLink, Guitar, ListMusic, Music, Users } from "lucide-react";
import Image from "next/image";

interface PublicSong {
  title: string;
  song_type: SongType;
  duration_sec: number | null;
}

export interface PublicBandPageData {
  name: string;
  slug: string;
  description: string | null;
  genre: string | null;
  logo_url: string | null;
  photos: string[];
  rider_public: boolean;
  repertoire_public: boolean;
  tech_rider: string | null;
  social_links: SocialLinks;
  tracks_count: number;
  members_count: number;
  songs: PublicSong[];
}

export function PublicBandPage({ band }: { band: PublicBandPageData }) {
  const links = Object.entries(band.social_links ?? {})
    .map(([key, url]) => [key, sanitizeHref(url)] as const)
    .filter((entry): entry is [string, string] => Boolean(entry[1]));
  const songs = band.songs ?? [];
  const photos = Array.isArray(band.photos) ? band.photos : [];
  const showRider = band.rider_public;
  const showRepertoire = band.repertoire_public;

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <ScrollToHash />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          {band.logo_url ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={band.logo_url}
                alt={band.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-dark">
              <Guitar className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted">
              BandOS
            </div>
            <h1 className="text-xl font-medium">{band.name}</h1>
          </div>
        </div>

        {band.genre && (
          <p className="mb-4 text-sm text-accent">{band.genre}</p>
        )}

        {showRider && band.description && (
          <p className="mb-6 text-sm text-text-secondary whitespace-pre-wrap">
            {band.description}
          </p>
        )}

        <div className="mb-8 flex gap-3 text-sm text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Music className="h-4 w-4" />
            {band.tracks_count} треков
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {band.members_count} участников
          </span>
        </div>

        {photos.length > 0 && (
          <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((url) => (
              <div
                key={url}
                className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border"
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {showRider && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-muted">
              Техрайдер
            </h2>
            {band.tech_rider ? (
              <div className="rounded-xl border border-border bg-bg-2 p-5">
                <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap text-text-primary">
                  {band.tech_rider}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-text-muted">Техрайдер пока не заполнен.</p>
            )}
          </section>
        )}

        {showRider && links.length > 0 && (
          <section className="mb-8 rounded-xl border border-border bg-bg-2 p-5">
            <h2 className="mb-3 text-sm font-medium">Ссылки</h2>
            <ul className="space-y-2">
              {links.map(([key, url]) => (
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
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg-2 text-xs uppercase tracking-wider text-text-muted">
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
      </div>
    </div>
  );
}

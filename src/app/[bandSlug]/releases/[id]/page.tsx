import { AppShell } from "@/components/layout/app-shell";
import { DeleteReleaseButton } from "@/components/releases/delete-release-button";
import { Button } from "@/components/ui/button";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { hasPermission } from "@/lib/band/permissions";
import { bandPath } from "@/lib/paths";
import { sanitizeHref } from "@/lib/safe-url";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import {
  RELEASE_PLATFORM_LABELS,
  type Release,
  type ReleaseLink,
  type ReleasePlatform,
} from "@/types/database";
import { Disc3, ExternalLink, Music, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ReleaseDetailPage({
  params,
}: {
  params: Promise<{ bandSlug: string; id: string }>;
}) {
  const { bandSlug, id } = await params;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount, supabase] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    createClient(),
  ]);

  const { data: release } = await supabase
    .from("releases")
    .select("*, release_links(*), songs(id, title)")
    .eq("id", id)
    .eq("band_id", band.id)
    .single();

  if (!release) notFound();

  const row = release as Release & {
    release_links: ReleaseLink[] | null;
    songs: { id: string; title: string } | { id: string; title: string }[] | null;
  };
  const links = row.release_links ?? [];
  const song = Array.isArray(row.songs) ? row.songs[0] : row.songs;
  const coverUrl = sanitizeHref(row.cover_url);
  const canEdit = member ? hasPermission(member, "songs") : false;

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title={row.title}
      actions={
        canEdit ? (
          <div className="flex gap-2">
            <Link href={bandPath(band.slug, "releases", id, "edit")}>
              <Button variant="accent">
                <Pencil className="h-3.5 w-3.5" />
                Редактировать
              </Button>
            </Link>
            <DeleteReleaseButton
              releaseId={id}
              bandSlug={band.slug}
              title={row.title}
            />
          </div>
        ) : undefined
      }
    >
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-bg-2">
          <div className="aspect-square bg-bg-3">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-text-muted">
                <Disc3 className="h-12 w-12 opacity-40" />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-bg-2 p-4">
          <h2 className="text-lg font-medium">{row.title}</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {formatDate(row.released_at, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          {song && (
            <Link
              href={bandPath(band.slug, "songs", song.id)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
            >
              <Music className="h-3.5 w-3.5" />
              Трек: {song.title}
            </Link>
          )}

          {row.notes && (
            <div className="mt-4">
              <h3 className="mb-1 text-xs uppercase tracking-wider text-text-muted">
                Заметки
              </h3>
              <p className="whitespace-pre-wrap text-sm text-text-secondary">
                {row.notes}
              </p>
            </div>
          )}

          <div className="mt-4">
            <h3 className="mb-2 text-xs uppercase tracking-wider text-text-muted">
              Площадки
            </h3>
            {links.length === 0 ? (
              <p className="text-sm text-text-secondary">Ссылок пока нет</p>
            ) : (
              <ul className="space-y-2">
                {links.map((link) => {
                  const href = sanitizeHref(link.url);
                  if (!href) return null;
                  return (
                    <li key={link.id}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {
                          RELEASE_PLATFORM_LABELS[
                            link.platform as ReleasePlatform
                          ]
                        }
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

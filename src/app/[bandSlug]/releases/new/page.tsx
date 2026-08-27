import { AppShell } from "@/components/layout/app-shell";
import { ReleaseForm } from "@/components/releases/release-form";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { bandPath } from "@/lib/paths";
import { notFound } from "next/navigation";

export default async function NewReleasePage({
  params,
  searchParams,
}: {
  params: Promise<{ bandSlug: string }>;
  searchParams: Promise<{ error?: string; songId?: string }>;
}) {
  const { bandSlug } = await params;
  const { error, songId } = await searchParams;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount, supabase] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    createClient(),
  ]);

  const { data: songs } = await supabase
    .from("songs")
    .select("id, title")
    .eq("band_id", band.id)
    .order("title");

  const songOptions = songs ?? [];
  const defaultSongId =
    songId && songOptions.some((s) => s.id === songId) ? songId : undefined;

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="Новый релиз"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {decodeURIComponent(error)}
        </div>
      )}
      {songOptions.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-2 px-4 py-8 text-center text-sm text-text-secondary">
          <p className="mb-3">
            Сначала добавьте трек в репертуар — релиз создаётся из существующего
            трека.
          </p>
          <Link
            href={bandPath(band.slug, "songs", "new")}
            className="text-accent hover:underline"
          >
            Создать трек
          </Link>
        </div>
      ) : (
        <ReleaseForm
          bandId={band.id}
          bandSlug={band.slug}
          songs={songOptions}
          defaultSongId={defaultSongId}
        />
      )}
    </AppShell>
  );
}

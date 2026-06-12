import { AppShell } from "@/components/layout/app-shell";
import { SongForm } from "@/components/songs/song-form";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { notFound } from "next/navigation";

export default async function NewSongPage({
  params,
  searchParams,
}: {
  params: Promise<{ bandSlug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { bandSlug } = await params;
  const { error } = await searchParams;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
  ]);

  return (
    <AppShell band={band} member={member} memberCount={memberCount} title="Новый трек">
      {error && (
        <div className="mb-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {decodeURIComponent(error)}
        </div>
      )}
      <SongForm bandId={band.id} bandSlug={band.slug} />
    </AppShell>
  );
}

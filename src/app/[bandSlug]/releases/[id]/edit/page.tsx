import { AppShell } from "@/components/layout/app-shell";
import { ReleaseForm } from "@/components/releases/release-form";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { createClient } from "@/lib/supabase/server";
import type { Release, ReleaseLink } from "@/types/database";
import { notFound } from "next/navigation";

export default async function EditReleasePage({
  params,
  searchParams,
}: {
  params: Promise<{ bandSlug: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { bandSlug, id } = await params;
  const { error } = await searchParams;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount, supabase] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    createClient(),
  ]);

  const [{ data: release }, { data: songs }] = await Promise.all([
    supabase
      .from("releases")
      .select("*, release_links(*)")
      .eq("id", id)
      .eq("band_id", band.id)
      .single(),
    supabase
      .from("songs")
      .select("id, title")
      .eq("band_id", band.id)
      .order("title"),
  ]);

  if (!release) notFound();

  const row = release as Release & {
    release_links: ReleaseLink[] | null;
  };

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="Редактировать релиз"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {decodeURIComponent(error)}
        </div>
      )}
      <ReleaseForm
        bandId={band.id}
        bandSlug={band.slug}
        songs={songs ?? []}
        release={row}
        links={row.release_links ?? []}
      />
    </AppShell>
  );
}

import { AppShell } from "@/components/layout/app-shell";
import { SetlistList } from "@/components/setlists/setlist-list";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { sumSetlistDurationSec } from "@/lib/setlist-duration";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/band/permissions";
import { notFound } from "next/navigation";

export default async function SetlistsPage({
  params,
}: {
  params: Promise<{ bandSlug: string }>;
}) {
  const { bandSlug } = await params;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount, supabase] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    createClient(),
  ]);

  const { data: setlists } = await supabase
    .from("setlists")
    .select("*")
    .eq("band_id", band.id)
    .order("created_at", { ascending: false });

  const setlistIds = setlists?.map((sl) => sl.id) ?? [];
  const durationBySetlist = new Map<string, number>();
  const countBySetlist = new Map<string, number>();

  if (setlistIds.length > 0) {
    const { data: items } = await supabase
      .from("setlist_items")
      .select("*, songs(duration_sec)")
      .in("setlist_id", setlistIds);

    const grouped = new Map<string, typeof items>();
    // Разделители блоков — не треки
    for (const item of (items ?? []).filter((i) => i.is_section !== true)) {
      const list = grouped.get(item.setlist_id) ?? [];
      list.push(item);
      grouped.set(item.setlist_id, list);
    }

    for (const [id, list] of grouped) {
      durationBySetlist.set(id, sumSetlistDurationSec(list ?? []));
      countBySetlist.set(id, list?.length ?? 0);
    }
  }

  const canEditSetlists = member ? hasPermission(member, "setlists") : false;

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="Сет-листы"
    >
      <SetlistList
        bandSlug={band.slug}
        canCreate={canEditSetlists}
        setlists={(setlists ?? []).map((sl) => ({
          id: sl.id,
          name: sl.name,
          itemCount: countBySetlist.get(sl.id) ?? 0,
          durationSec: durationBySetlist.get(sl.id) ?? 0,
        }))}
      />
    </AppShell>
  );
}

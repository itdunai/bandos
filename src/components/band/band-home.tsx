import { BandHomeShell } from "@/components/band/band-home-shell";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { hasPermission } from "@/lib/band/permissions";
import { createClient } from "@/lib/supabase/server";
import type { Band } from "@/types/database";
import { notFound } from "next/navigation";

export async function BandHome({
  bandSlug,
  edit,
}: {
  bandSlug: string;
  edit?: string;
}) {
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount, supabase] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    createClient(),
  ]);

  const { count: tracksCount } = await supabase
    .from("songs")
    .select("*", { count: "exact", head: true })
    .eq("band_id", band.id);

  const canEditProfile = member ? hasPermission(member, "band_profile") : false;

  return (
    <BandHomeShell
      band={band as Band}
      member={member}
      memberCount={memberCount}
      tracksCount={tracksCount ?? 0}
      riderSharePath={`/rider/${band.slug}`}
      canEditProfile={canEditProfile}
      initialEdit={edit === "1"}
    />
  );
}

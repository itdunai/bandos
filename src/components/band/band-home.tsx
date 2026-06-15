import { BandProfileForm } from "@/components/band/band-profile-form";
import { BandProfileView } from "@/components/band/band-profile-view";
import { Button } from "@/components/ui/button";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { hasPermission } from "@/lib/band/permissions";
import { bandPath } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import type { Band } from "@/types/database";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

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
  const isEditing = edit === "1" && canEditProfile;
  const riderSharePath = `/rider/${band.slug}`;
  const bandFull = band as Band;

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="О группе"
      actions={
        canEditProfile && !isEditing ? (
          <Link href={`${bandPath(band.slug)}?edit=1`}>
            <Button variant="accent">
              <Pencil className="h-3.5 w-3.5" />
              Редактировать
            </Button>
          </Link>
        ) : isEditing ? (
          <Link href={bandPath(band.slug)}>
            <Button>Отмена</Button>
          </Link>
        ) : undefined
      }
    >
      {isEditing ? (
        <BandProfileForm
          band={{
            ...bandFull,
            logo_url: bandFull.logo_url ?? null,
            photos: Array.isArray(bandFull.photos) ? bandFull.photos : [],
            description: bandFull.description ?? null,
            genre: bandFull.genre ?? null,
            tech_rider: bandFull.tech_rider ?? null,
            rider_public: bandFull.rider_public ?? true,
            social_links: bandFull.social_links ?? {},
          }}
          tracksCount={tracksCount ?? 0}
          membersCount={memberCount}
          riderSharePath={riderSharePath}
        />
      ) : (
        <BandProfileView
          band={{
            ...bandFull,
            logo_url: bandFull.logo_url ?? null,
            photos: Array.isArray(bandFull.photos) ? bandFull.photos : [],
            description: bandFull.description ?? null,
            genre: bandFull.genre ?? null,
            tech_rider: bandFull.tech_rider ?? null,
            rider_public: bandFull.rider_public ?? true,
            social_links: bandFull.social_links ?? {},
          }}
          tracksCount={tracksCount ?? 0}
          membersCount={memberCount}
          riderSharePath={riderSharePath}
        />
      )}
    </AppShell>
  );
}

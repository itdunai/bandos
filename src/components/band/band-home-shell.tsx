"use client";

import { BandProfileForm } from "@/components/band/band-profile-form";
import { BandProfileView } from "@/components/band/band-profile-view";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { bandPath } from "@/lib/paths";
import type { Band, BandMember } from "@/types/database";
import { Pencil } from "lucide-react";
import { useState } from "react";

export function BandHomeShell({
  band,
  member,
  memberCount,
  tracksCount,
  riderSharePath,
  canEditProfile,
  initialEdit,
}: {
  band: Band;
  member: BandMember | null;
  memberCount: number;
  tracksCount: number;
  riderSharePath: string;
  canEditProfile: boolean;
  initialEdit: boolean;
}) {
  const [isEditing, setIsEditing] = useState(initialEdit && canEditProfile);
  const bandPathBase = bandPath(band.slug);

  function enterEdit() {
    setIsEditing(true);
    window.history.replaceState(null, "", `${bandPathBase}?edit=1`);
  }

  function exitEdit() {
    setIsEditing(false);
    window.history.replaceState(null, "", bandPathBase);
  }

  const bandProps = {
    ...band,
    logo_url: band.logo_url ?? null,
    photos: Array.isArray(band.photos) ? band.photos : [],
    description: band.description ?? null,
    genre: band.genre ?? null,
    tech_rider: band.tech_rider ?? null,
    rider_public: band.rider_public ?? true,
    social_links: band.social_links ?? {},
  };

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="О группе"
      actions={
        canEditProfile && !isEditing ? (
          <Button type="button" variant="accent" onClick={enterEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Редактировать
          </Button>
        ) : isEditing ? (
          <Button type="button" onClick={exitEdit}>
            Отмена
          </Button>
        ) : undefined
      }
    >
      {isEditing ? (
        <BandProfileForm
          band={bandProps}
          tracksCount={tracksCount}
          membersCount={memberCount}
          riderSharePath={riderSharePath}
        />
      ) : (
        <BandProfileView
          band={bandProps}
          tracksCount={tracksCount}
          membersCount={memberCount}
          riderSharePath={riderSharePath}
        />
      )}
    </AppShell>
  );
}

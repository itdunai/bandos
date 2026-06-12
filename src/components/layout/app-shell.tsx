"use client";

import { usePathname } from "next/navigation";
import { useUpcomingEvent } from "@/components/layout/band-shell-context";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { UpcomingEventBanner } from "@/components/schedule/upcoming-event-banner";
import { isUpcomingBannerHiddenPath } from "@/lib/paths";
import type { Band, BandMember } from "@/types/database";

function UpcomingBannerSlot({ bandSlug }: { bandSlug: string }) {
  const pathname = usePathname();
  const upcoming = useUpcomingEvent();
  if (!upcoming || isUpcomingBannerHiddenPath(pathname)) return null;
  return <UpcomingEventBanner event={upcoming} bandSlug={bandSlug} />;
}

export function AppShell({
  band,
  member,
  memberCount,
  title,
  children,
  actions,
  fullWidth,
}: {
  band: Band;
  member: BandMember | null;
  memberCount: number;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className="flex min-h-screen bg-bg">
      <div className="hidden md:flex">
        <Sidebar band={band} member={member} memberCount={memberCount} />
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        <MobileHeader band={band} member={member} />
        {!fullWidth && (
          <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
            <h1 className="text-base font-medium">{title}</h1>
            {actions && <div className="flex gap-2">{actions}</div>}
          </header>
        )}

        <main
          className={
            fullWidth
              ? "flex-1"
              : "flex-1 overflow-y-auto p-5 pb-20 md:pb-5"
          }
        >
          {!fullWidth && <UpcomingBannerSlot bandSlug={band.slug} />}
          {children}
        </main>
      </div>

      <MobileNav bandSlug={band.slug} />
    </div>
  );
}

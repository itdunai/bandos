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
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-bg md:h-dvh md:max-h-dvh md:overflow-hidden">
      <div className="hidden shrink-0 md:flex">
        <Sidebar band={band} member={member} memberCount={memberCount} />
      </div>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:min-h-0 md:overflow-hidden">
        <MobileHeader band={band} member={member} />
        {!fullWidth && (
          <header className="flex shrink-0 flex-col gap-2 border-b border-border px-5 py-3.5 md:flex-row md:items-center md:justify-between">
            <h1 className="w-full min-w-0 text-base font-medium md:w-auto">
              {title}
            </h1>
            {actions && (
              <div className="flex w-full flex-wrap gap-2 md:w-auto md:justify-end">
                {actions}
              </div>
            )}
          </header>
        )}

        <main
          className={
            fullWidth
              ? "min-h-0 min-w-0 flex-1 overflow-x-hidden"
              : "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-5 pb-mobile-main md:pb-5"
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

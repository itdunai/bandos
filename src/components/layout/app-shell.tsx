"use client";

import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import type { Band, BandMember } from "@/types/database";

export function AppShell({
  band,
  member,
  memberCount,
  title,
  subtitle,
  children,
  actions,
  fullWidth,
}: {
  band: Band;
  member: BandMember | null;
  memberCount: number;
  title: string;
  subtitle?: React.ReactNode;
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
          <header className="flex shrink-0 flex-col gap-3 px-5 pb-2 pt-5 md:flex-row md:items-end md:justify-between md:px-8 md:pt-7">
            <div className="w-full min-w-0 md:w-auto">
              <h1 className="heading-poster text-xl md:text-[28px]">{title}</h1>
              {subtitle && (
                <div className="mt-1.5 text-sm text-text-secondary">{subtitle}</div>
              )}
            </div>
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
              : "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-5 pb-mobile-main md:px-8 md:pb-8 md:pt-5"
          }
        >
          {children}
        </main>
      </div>

      <MobileNav bandSlug={band.slug} />
    </div>
  );
}

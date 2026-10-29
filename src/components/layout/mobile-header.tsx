"use client";

import { BandSwitcher } from "@/components/layout/band-switcher";
import {
  useUnreadFeedback,
  useUpcomingEvent,
  useUserBands,
} from "@/components/layout/band-shell-context";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { UpcomingEventChip } from "@/components/schedule/upcoming-event-chip";
import type { Band, BandMember } from "@/types/database";
import { Menu } from "lucide-react";
import { useCallback, useState } from "react";

export function MobileHeader({
  band,
  member,
}: {
  band: Band;
  member: BandMember | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const userBands = useUserBands();
  const upcoming = useUpcomingEvent();
  const unreadFeedback = useUnreadFeedback();

  return (
    <>
      <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between gap-2 border-b border-border bg-bg-2 px-4 py-3 md:hidden">
        <div className="min-w-0 flex-1">
          <BandSwitcher bands={userBands} currentBand={band} compact />
        </div>
        <UpcomingEventChip event={upcoming} bandSlug={band.slug} variant="header" />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-3"
          aria-label={unreadFeedback ? "Открыть меню — есть ответ на обращение" : "Открыть меню"}
        >
          <Menu className="h-5 w-5" />
          {unreadFeedback > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" aria-hidden />
          )}
        </button>
      </header>
      <MobileMenu
        bandSlug={band.slug}
        member={member}
        open={menuOpen}
        onClose={closeMenu}
      />
    </>
  );
}

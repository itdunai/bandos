"use client";

import { BandSwitcher } from "@/components/layout/band-switcher";
import { useUserBands } from "@/components/layout/band-shell-context";
import { MobileMenu } from "@/components/layout/mobile-menu";
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

  return (
    <>
      <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between gap-2 border-b border-border bg-bg-2 px-4 py-3 md:hidden">
        <div className="min-w-0 flex-1">
          <BandSwitcher bands={userBands} currentBand={band} compact />
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-3"
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5" />
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

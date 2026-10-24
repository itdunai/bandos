"use client";

import { signOut } from "@/app/actions/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SubmitButton } from "@/components/ui/submit-button";
import { LogOut, Play, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { bandPath } from "@/lib/paths";
import { Avatar } from "@/components/ui/avatar";
import { BandSwitcher } from "@/components/layout/band-switcher";
import {
  BAND_NAV,
  isNavItemActive,
  isNavItemVisible,
  navItemHref,
} from "@/components/layout/band-nav";
import { BuildVersionLabel } from "@/components/layout/build-version-label";
import {
  useUpcomingEvent,
  useUserBands,
} from "@/components/layout/band-shell-context";
import { UpcomingEventChip } from "@/components/schedule/upcoming-event-chip";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { Band, BandMember } from "@/types/database";
import { INSTRUMENT_LABELS } from "@/types/database";

export function Sidebar({
  band,
  member,
  memberCount,
}: {
  band: Band;
  member: BandMember | null;
  memberCount: number;
}) {
  const pathname = usePathname();
  const userBands = useUserBands();
  const upcoming = useUpcomingEvent();
  const playHref = bandPath(band.slug, "play");
  const playActive = isNavItemActive(pathname, playHref, false);

  return (
    <aside className="flex h-dvh w-[232px] shrink-0 flex-col border-r border-border bg-bg">
      <div className="px-3 pb-2 pt-4">
        <BandSwitcher bands={userBands} currentBand={band} />
        <div className="mt-0.5 px-1 text-xs text-text-muted">
          {memberCount} участник{memberCount === 1 ? "" : memberCount < 5 ? "а" : "ов"}
        </div>
        <UpcomingEventChip event={upcoming} bandSlug={band.slug} variant="sidebar" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {BAND_NAV.map((group, gi) => (
          <div key={group.section ?? gi} className={cn(gi > 0 && "mt-3")}>
            {group.section && (
              <div className="px-2.5 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                {group.section}
              </div>
            )}
            {group.items.map((item) => {
              if (!isNavItemVisible(item, member)) return null;
              const href = navItemHref(band.slug, item);
              const active = isNavItemActive(pathname, href, !item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href || "home"}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-ink"
                      : "text-text-secondary hover:bg-bg-3 hover:text-text-primary"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}

        <Link
          href={playHref}
          className={cn(
            "mt-4 flex items-center justify-center gap-2 rounded-lg py-2.5 font-display text-xs font-bold uppercase tracking-wide transition-colors",
            playActive
              ? "bg-accent-dark text-accent-ink"
              : "bg-accent text-accent-ink hover:bg-accent-dark"
          )}
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          Играем
        </Link>
      </nav>

      <div className="mt-auto space-y-3 border-t border-border p-3">
        <ThemeToggle />
        {member && (
          <div className="flex items-center gap-2.5 px-1">
            <Avatar
              name={member.display_name ?? "?"}
              className="h-8 w-8 text-xs"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {member.display_name}
              </div>
              <div className="truncate text-xs text-text-muted">
                {INSTRUMENT_LABELS[member.instrument]}
              </div>
            </div>
            <form action={signOut}>
              <SubmitButton
                type="submit"
                variant="ghost"
                size="icon"
                loadingLabel=""
                title="Выйти"
                aria-label="Выйти"
              >
                <LogOut className="h-4 w-4" />
              </SubmitButton>
            </form>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 px-1">
          <Link
            href="/new-band"
            className="flex items-center gap-1.5 text-xs text-accent hover:underline"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            Создать группу
          </Link>
          <BuildVersionLabel className="truncate text-[11px] text-text-muted" />
        </div>
      </div>
    </aside>
  );
}

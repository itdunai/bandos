"use client";

import { signOut } from "@/app/actions/auth";
import { canViewFinances } from "@/lib/band/permissions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Calendar,
  ClipboardList,
  Info,
  ListMusic,
  Music,
  Play,
  Plus,
  LogOut,
  Timer,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { bandPath } from "@/lib/paths";
import { Avatar } from "@/components/ui/avatar";
import { BandSwitcher } from "@/components/layout/band-switcher";
import { useUserBands } from "@/components/layout/band-shell-context";
import type { Band, BandMember } from "@/types/database";
import { INSTRUMENT_LABELS } from "@/types/database";

const NAV = [
  { section: "Обзор", items: [{ href: "todos", label: "Список дел", icon: ClipboardList }] },
  {
    section: "Группа",
    items: [
      { href: "", label: "О группе", icon: Info, isHome: true },
      { href: "members", label: "Участники", icon: Users },
      { href: "finances", label: "Финансы", icon: Wallet },
    ],
  },
  {
    section: "Музыка",
    items: [
      { href: "songs", label: "Треки", icon: Music },
      { href: "setlists", label: "Сет-листы", icon: ListMusic },
    ],
  },
  {
    section: "События",
    items: [{ href: "schedule", label: "График", icon: Calendar }],
  },
  {
    section: "Режим",
    items: [
      { href: "play", label: "ИГРАЕМ", icon: Play, highlight: true },
      { href: "metronome", label: "Метроном", icon: Timer },
    ],
  },
] as const;

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

  return (
    <aside className="flex w-[200px] shrink-0 flex-col border-r border-border bg-bg-2">
      <div className="border-b border-border px-4 py-4">
        <BandSwitcher bands={userBands} currentBand={band} />
        <div className="mt-1 text-[11px] text-text-muted">
          {memberCount} участник{memberCount === 1 ? "" : memberCount < 5 ? "а" : "ов"}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="px-4 pb-1 pt-2.5 text-[10px] uppercase tracking-widest text-text-muted">
              {group.section}
            </div>
            {group.items.map((item) => {
              if (
                item.href === "finances" &&
                member &&
                !canViewFinances(member)
              ) {
                return null;
              }

              const href =
                "isHome" in item && item.isHome
                  ? bandPath(band.slug)
                  : bandPath(band.slug, item.href);
              const active =
                "isHome" in item && item.isHome
                  ? pathname === href
                  : pathname === href || pathname.startsWith(`${href}/`);
              const Icon = item.icon;
              const highlight = "highlight" in item && item.highlight;

              return (
                <Link
                  key={item.href || "home"}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors",
                    active
                      ? "bg-bg-3 text-accent"
                      : "text-text-secondary hover:bg-bg-3 hover:text-text-primary",
                    highlight && !active && "text-accent/80"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-border p-3 space-y-3">
        <Link
          href="/new-band"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-accent transition-colors hover:bg-bg-3"
        >
          <Plus className="h-3.5 w-3.5 shrink-0" />
          Создать группу
        </Link>
        <form action={signOut}>
          <SubmitButton
            type="submit"
            variant="ghost"
            loadingLabel="Выход…"
            className="flex h-auto w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-3 hover:text-text-primary"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            Выйти
          </SubmitButton>
        </form>
        {member && (
          <div className="flex items-center gap-2">
            <Avatar
              name={member.display_name ?? "?"}
              className="h-7 w-7 text-[11px]"
            />
            <div className="min-w-0">
              <div className="truncate text-xs font-medium">
                {member.display_name}
              </div>
              <div className="truncate text-[10px] text-text-muted">
                {INSTRUMENT_LABELS[member.instrument]}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

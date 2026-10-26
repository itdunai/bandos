import { canViewFinances, hasPermission } from "@/lib/band/permissions";
import { bandPath } from "@/lib/paths";
import type { BandMember } from "@/types/database";
import {
  Calendar,
  ClipboardList,
  Disc3,
  Inbox,
  Info,
  LayoutDashboard,
  ListMusic,
  Music,
  Timer,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface BandNavItem {
  /** Сегмент после slug группы; "" — «Обзор». */
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface BandNavGroup {
  section: string | null;
  items: BandNavItem[];
}

export const BAND_NAV: BandNavGroup[] = [
  {
    section: null,
    items: [
      { href: "", label: "Обзор", icon: LayoutDashboard },
      { href: "schedule", label: "График", icon: Calendar },
      { href: "todos", label: "Дела", icon: ClipboardList },
    ],
  },
  {
    section: "Музыка",
    items: [
      { href: "songs", label: "Треки", icon: Music },
      { href: "setlists", label: "Сет-листы", icon: ListMusic },
      { href: "releases", label: "Релизы", icon: Disc3 },
      { href: "metronome", label: "Метроном", icon: Timer },
    ],
  },
  {
    section: "Группа",
    items: [
      { href: "group", label: "О группе", icon: Info },
      { href: "bookings", label: "Заявки", icon: Inbox },
      { href: "members", label: "Участники", icon: Users },
      { href: "finances", label: "Финансы", icon: Wallet },
    ],
  },
];

export function isNavItemVisible(item: BandNavItem, member: BandMember | null) {
  if (item.href === "finances" && member && !canViewFinances(member)) return false;
  if (item.href === "bookings" && (!member || !hasPermission(member, "band_profile"))) return false;
  return true;
}

export function navItemHref(bandSlug: string, item: BandNavItem) {
  return item.href ? bandPath(bandSlug, item.href) : bandPath(bandSlug);
}

export function isNavItemActive(pathname: string, href: string, isHome: boolean) {
  if (isHome) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

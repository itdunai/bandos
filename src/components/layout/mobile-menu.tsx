"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  ClipboardList,
  Info,
  LogOut,
  Plus,
  Timer,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { canViewFinances } from "@/lib/band/permissions";
import { cn } from "@/lib/utils";
import type { BandMember } from "@/types/database";
import { bandPath } from "@/lib/paths";
import { useEffect } from "react";

const MENU_ITEMS = [
  { href: "todos", label: "Дела", icon: ClipboardList },
  { href: "", label: "О группе", icon: Info, isHome: true },
  { href: "members", label: "Участники", icon: Users },
  { href: "finances", label: "Финансы", icon: Wallet },
  { href: "schedule", label: "График", icon: Calendar },
  { href: "metronome", label: "Метроном", icon: Timer },
] as const;

export function MobileMenu({
  bandSlug,
  member,
  open,
  onClose,
}: {
  bandSlug: string;
  member: BandMember | null;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/50 md:hidden"
        aria-label="Закрыть меню"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-[61] flex h-full w-[min(280px,85vw)] flex-col border-l border-border bg-bg-2 shadow-xl md:hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-medium">Меню</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-3"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {MENU_ITEMS.map((item) => {
            if (
              item.href === "finances" &&
              member &&
              !canViewFinances(member)
            ) {
              return null;
            }

            const href =
              "isHome" in item && item.isHome
                ? bandPath(bandSlug)
                : bandPath(bandSlug, item.href);
            const active =
              "isHome" in item && item.isHome
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href || "home"}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                  active
                    ? "bg-bg-3 text-accent"
                    : "text-text-secondary hover:bg-bg-3 hover:text-text-primary"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-border p-3">
          <Link
            href="/new-band"
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-accent transition-colors hover:bg-bg-3"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Создать группу
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-bg-3 hover:text-text-primary"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Выйти
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

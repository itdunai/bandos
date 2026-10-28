"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, MessageSquare, Plus, X } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import {
  BAND_NAV,
  isNavItemActive,
  isNavItemVisible,
  navItemHref,
} from "@/components/layout/band-nav";
import { BuildVersionLabel } from "@/components/layout/build-version-label";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";
import type { BandMember } from "@/types/database";
import { useEffect } from "react";

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
          <span className="font-display text-sm font-bold uppercase">Меню</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-3"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {BAND_NAV.map((group, gi) => (
            <div key={group.section ?? gi} className={cn(gi > 0 && "mt-2")}>
              {group.section && (
                <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                  {group.section}
                </div>
              )}
              {group.items.map((item) => {
                if (!isNavItemVisible(item, member)) return null;
                const href = navItemHref(bandSlug, item);
                const active = isNavItemActive(pathname, href, !item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href || "home"}
                    href={href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors",
                      active
                        ? "bg-accent text-accent-ink"
                        : "text-text-secondary hover:bg-bg-3 hover:text-text-primary"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="space-y-1 border-t border-border p-3">
          <ThemeToggle className="mb-2" />
          <Link
            href="/new-band"
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-accent transition-colors hover:bg-bg-3"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Создать группу
          </Link>
          <Link
            href={`/feedback?from=${encodeURIComponent(pathname)}`}
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-bg-3 hover:text-text-primary"
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            Обратная связь
          </Link>
          <form action={signOut}>
            <SubmitButton
              type="submit"
              variant="ghost"
              loadingLabel="Выход…"
              className="flex h-auto w-full items-center justify-start gap-2 rounded-lg px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-bg-3 hover:text-text-primary"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Выйти
            </SubmitButton>
          </form>
          <BuildVersionLabel className="px-3 pt-1 text-[11px] text-text-muted" />
        </div>
      </aside>
    </>
  );
}

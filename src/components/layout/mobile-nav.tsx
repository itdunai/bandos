"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListMusic, Music, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { bandPath } from "@/lib/paths";
import { isNavItemActive } from "@/components/layout/band-nav";

const ITEMS = [
  { href: "", label: "Обзор", icon: LayoutDashboard },
  { href: "songs", label: "Треки", icon: Music },
  { href: "setlists", label: "Сет-листы", icon: ListMusic },
  { href: "play", label: "Играем", icon: Play, highlight: true },
] as const;

export function MobileNav({ bandSlug }: { bandSlug: string }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-bg-2 px-1.5 pb-safe md:hidden">
      {ITEMS.map((item) => {
        const href = item.href ? bandPath(bandSlug, item.href) : bandPath(bandSlug);
        const active = isNavItemActive(pathname, href, !item.href);
        const Icon = item.icon;
        const highlight = "highlight" in item && item.highlight;

        return (
          <Link
            key={item.href || "home"}
            href={href}
            aria-current={active ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium"
          >
            <span
              className={cn(
                "flex h-8 w-12 items-center justify-center rounded-lg transition-colors",
                active
                  ? "bg-accent text-accent-ink"
                  : highlight
                    ? "bg-accent/15 text-accent"
                    : "text-text-muted"
              )}
            >
              <Icon className={cn("h-5 w-5", highlight && "fill-current")} />
            </span>
            <span className={active ? "text-text-primary" : "text-text-muted"}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListMusic, Music, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { bandPath } from "@/lib/paths";

const ITEMS = [
  { href: "setlists", label: "Сет-лист", icon: ListMusic },
  { href: "play", label: "Играем", icon: Play, highlight: true },
  { href: "songs", label: "Треки", icon: Music },
] as const;

export function MobileNav({ bandSlug }: { bandSlug: string }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-bg-2 md:hidden">
      {ITEMS.map((item) => {
        const href = bandPath(bandSlug, item.href);
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px]",
              active ? "text-accent" : "text-text-muted",
              "highlight" in item && item.highlight && !active && "text-accent/70"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

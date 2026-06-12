"use client";

import { bandPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import type { Band } from "@/types/database";
import { ChevronDown, Guitar, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function BandSwitcher({
  bands,
  currentBand,
  compact,
}: {
  bands: Band[];
  currentBand: Band;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full min-w-0 items-center gap-2 rounded-lg transition-colors hover:bg-bg-3",
          compact ? "py-0.5" : "px-1 py-1"
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-dark">
          <Guitar className="h-3.5 w-3.5 text-white" />
        </div>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-left font-medium",
            compact ? "text-sm" : "text-[15px]"
          )}
        >
          {currentBand.name}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 max-h-64 w-full min-w-[220px] overflow-y-auto rounded-lg border border-border bg-bg-2 py-1 shadow-lg"
        >
          {bands.map((b) => (
            <li key={b.id}>
              <Link
                href={bandPath(b.slug)}
                className={cn(
                  "block truncate px-3 py-2 text-sm transition-colors hover:bg-bg-3",
                  b.id === currentBand.id
                    ? "text-accent"
                    : "text-text-secondary"
                )}
              >
                {b.name}
              </Link>
            </li>
          ))}
          <li className="mt-1 border-t border-border pt-1">
            <Link
              href="/new-band"
              className="flex items-center gap-2 px-3 py-2 text-sm text-accent transition-colors hover:bg-bg-3"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              Создать группу
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}

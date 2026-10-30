"use client";

import { addSetlistSong } from "@/app/actions/setlists";
import { useToast } from "@/components/ui/toast-provider";
import { bandPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import { Check, ListPlus, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

export interface SongMenuSetlist {
  id: string;
  name: string;
  songIds: string[];
}

const MENU_WIDTH = 256;

/**
 * «⋯» у трека: добавить в сет-лист. Окно позиционируется относительно экрана —
 * таблица треков прокручивается и обрезала бы обычный выпадающий блок.
 */
export function SongActionsMenu({
  songId,
  songTitle,
  bandSlug,
  setlists,
  className,
}: {
  songId: string;
  songTitle: string;
  bandSlug: string;
  setlists: SongMenuSetlist[];
  className?: string;
}) {
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = pos !== null;

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (open) return setPos(null);
    const rect = buttonRef.current!.getBoundingClientRect();
    const up = window.innerHeight - rect.bottom < 280 && rect.top > 280;
    const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
    setPos(
      up
        ? { left, bottom: window.innerHeight - rect.top + 4 }
        : { left, top: rect.bottom + 4 }
    );
  }

  useEffect(() => {
    if (!open) return;
    const close = () => setPos(null);
    function onDown(e: PointerEvent) {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !buttonRef.current?.contains(t)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function add(setlist: SongMenuSetlist) {
    startTransition(async () => {
      const res = await addSetlistSong(setlist.id, bandSlug, songId);
      if (!res.ok) {
        showToast("error", res.error ?? "Не удалось добавить");
        return;
      }
      setAdded((prev) => new Set(prev).add(setlist.id));
      showToast("success", `«${songTitle}» — в «${setlist.name}»`);
      setPos(null);
    });
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Действия с треком «${songTitle}»`}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-3 hover:text-text-primary",
          open && "bg-bg-3 text-text-primary",
          className
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {pos && (
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: "fixed",
            left: pos.left,
            width: MENU_WIDTH,
            top: pos.top,
            bottom: pos.bottom,
          }}
          className={cn(
            "z-50 rounded-lg border border-border-strong bg-bg-2 p-1 shadow-xl",
            pending && "pointer-events-none opacity-70"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            <ListPlus className="h-3.5 w-3.5" />
            Добавить в сет-лист
          </div>
          <div className="max-h-60 overflow-y-auto">
            {setlists.map((sl) => {
              const inside = added.has(sl.id) || sl.songIds.includes(songId);
              return (
                <button
                  key={sl.id}
                  type="button"
                  role="menuitem"
                  onClick={() => add(sl)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-bg-3"
                >
                  <span className="min-w-0 flex-1 truncate">{sl.name}</span>
                  {inside && (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-text-muted">
                      <Check className="h-3.5 w-3.5" />
                      уже есть
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <Link
            href={bandPath(bandSlug, "setlists", "new")}
            role="menuitem"
            className="mt-1 flex items-center gap-2 border-t border-border px-2.5 pb-1.5 pt-2 text-sm text-accent hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            Новый сет-лист
          </Link>
        </div>
      )}
    </>
  );
}

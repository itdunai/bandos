"use client";

import { PLAY_FONT_CLASS } from "@/lib/play/fonts";
import {
  clampScale,
  PLAY_FONTS,
  PLAY_SCALE_MAX,
  PLAY_SCALE_MIN,
  PLAY_SCALE_STEP,
  playFontLabel,
  resolvePlayFont,
  type PlayTextPrefs,
} from "@/lib/play/text-prefs";
import { cn } from "@/lib/utils";
import { AArrowDown, AArrowUp, AlignCenter, AlignLeft, CaseSensitive, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const iconButton =
  "flex h-8 min-w-8 shrink-0 items-center justify-center gap-1 rounded-lg px-1.5 text-text-secondary transition-colors hover:bg-bg-3 hover:text-text-primary disabled:opacity-40 disabled:hover:bg-transparent";

type Patch = Partial<Omit<PlayTextPrefs, "updatedAt">>;

/** Размер, выравнивание и шрифт текста в «Играем» — иконки в верхней плашке. */
export function PlayTextToolbar({
  prefs,
  onChange,
}: {
  prefs: PlayTextPrefs;
  onChange: (patch: Patch) => void;
}) {
  const percent = Math.round(prefs.scale * 100);

  return (
    <div className="flex shrink-0 items-center" role="toolbar" aria-label="Настройки текста">
      <button
        type="button"
        className={iconButton}
        disabled={prefs.scale <= PLAY_SCALE_MIN}
        onClick={() => onChange({ scale: clampScale(prefs.scale - PLAY_SCALE_STEP) })}
        aria-label={`Меньше шрифт (сейчас ${percent}%)`}
        title="Меньше"
      >
        <AArrowDown className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={cn(iconButton, "hidden w-11 text-[11px] tabular-nums sm:flex")}
        onClick={() => onChange({ scale: 1 })}
        title="Обычный размер"
        aria-label={`Размер ${percent}% — сбросить`}
      >
        {percent}%
      </button>
      <button
        type="button"
        className={iconButton}
        disabled={prefs.scale >= PLAY_SCALE_MAX}
        onClick={() => onChange({ scale: clampScale(prefs.scale + PLAY_SCALE_STEP) })}
        aria-label={`Крупнее шрифт (сейчас ${percent}%)`}
        title="Крупнее"
      >
        <AArrowUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={iconButton}
        onClick={() => onChange({ align: prefs.align === "center" ? "left" : "center" })}
        aria-label={prefs.align === "center" ? "Выровнять по левому краю" : "Выровнять по центру"}
        title={prefs.align === "center" ? "По левому краю" : "По центру"}
      >
        {prefs.align === "center" ? (
          <AlignCenter className="h-4 w-4" />
        ) : (
          <AlignLeft className="h-4 w-4" />
        )}
      </button>
      <FontMenu prefs={prefs} onChange={onChange} />
    </div>
  );
}

/** Меню шрифтов: каждый вариант подписан своим же начертанием. */
function FontMenu({ prefs, onChange }: { prefs: PlayTextPrefs; onChange: (patch: Patch) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cn(iconButton, open && "bg-bg-3 text-text-primary")}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Шрифт: ${playFontLabel(prefs.font)}`}
        title={`Шрифт: ${playFontLabel(prefs.font)}`}
      >
        <CaseSensitive className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-[min(280px,calc(100vw-16px))] rounded-lg border border-border-strong bg-bg-2 p-1 shadow-xl"
        >
          <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            Шрифт
          </div>
          {PLAY_FONTS.map((font) => {
            const active = prefs.font === font.id;
            return (
              <button
                key={font.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onChange({ font: font.id });
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left hover:bg-bg-3",
                  active && "bg-bg-3"
                )}
              >
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-[15px] leading-tight text-text-primary",
                      PLAY_FONT_CLASS[resolvePlayFont(font.id, "lyrics")]
                    )}
                  >
                    {font.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-text-muted">{font.hint}</span>
                </span>
                {active && <Check className="h-4 w-4 shrink-0 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

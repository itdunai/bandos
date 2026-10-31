"use client";

import {
  clampScale,
  PLAY_FONT_LABELS,
  PLAY_FONT_ORDER,
  PLAY_SCALE_MAX,
  PLAY_SCALE_MIN,
  PLAY_SCALE_STEP,
  type PlayTextPrefs,
} from "@/lib/play/text-prefs";
import { cn } from "@/lib/utils";
import { AArrowDown, AArrowUp, AlignCenter, AlignLeft, CaseSensitive } from "lucide-react";

const iconButton =
  "flex h-8 min-w-8 shrink-0 items-center justify-center gap-1 rounded-lg px-1.5 text-text-secondary transition-colors hover:bg-bg-3 hover:text-text-primary disabled:opacity-40 disabled:hover:bg-transparent";

/** Размер, выравнивание и шрифт текста в «Играем» — иконки в верхней плашке. */
export function PlayTextToolbar({
  prefs,
  onChange,
}: {
  prefs: PlayTextPrefs;
  onChange: (patch: Partial<Omit<PlayTextPrefs, "updatedAt">>) => void;
}) {
  const percent = Math.round(prefs.scale * 100);
  const nextFont = PLAY_FONT_ORDER[(PLAY_FONT_ORDER.indexOf(prefs.font) + 1) % PLAY_FONT_ORDER.length];

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
      <button
        type="button"
        className={iconButton}
        onClick={() => onChange({ font: nextFont })}
        aria-label={`Шрифт: ${PLAY_FONT_LABELS[prefs.font]}. Переключить на «${PLAY_FONT_LABELS[nextFont]}»`}
        title={`Шрифт: ${PLAY_FONT_LABELS[prefs.font]}`}
      >
        <CaseSensitive className="h-4 w-4" />
        <span className="hidden text-[11px] sm:inline">{PLAY_FONT_LABELS[prefs.font]}</span>
      </button>
    </div>
  );
}

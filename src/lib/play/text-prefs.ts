/** Настройки текста в режиме «Играем» — свои у каждого пользователя. */
export type PlayTextAlign = "center" | "left";
/** auto: аккорды и табы моноширинным, текст песни — обычным */
export type PlayTextFont = "auto" | "mono" | "sans" | "serif";

export interface PlayTextPrefs {
  /** Множитель размера шрифта, 0.7–2.5 */
  scale: number;
  align: PlayTextAlign;
  font: PlayTextFont;
  /** Когда меняли (мс) — побеждает более свежая запись: браузер или профиль */
  updatedAt: number;
}

export const PLAY_SCALE_MIN = 0.7;
export const PLAY_SCALE_MAX = 2.5;
export const PLAY_SCALE_STEP = 0.1;

export const DEFAULT_PLAY_TEXT_PREFS: PlayTextPrefs = {
  scale: 1,
  align: "center",
  font: "auto",
  updatedAt: 0,
};

export const PLAY_FONT_LABELS: Record<PlayTextFont, string> = {
  auto: "Авто",
  mono: "Моно",
  sans: "Обычный",
  serif: "С засечками",
};

export const PLAY_FONT_ORDER: PlayTextFont[] = ["auto", "mono", "sans", "serif"];

export function clampScale(scale: number): number {
  const rounded = Math.round(scale * 10) / 10;
  return Math.min(PLAY_SCALE_MAX, Math.max(PLAY_SCALE_MIN, rounded));
}

/** Из БД или localStorage — чужое и старое значение не должно ломать «Играем». */
export function parsePlayTextPrefs(value: unknown): PlayTextPrefs {
  const v = (value && typeof value === "object" ? value : {}) as Partial<PlayTextPrefs>;
  const d = DEFAULT_PLAY_TEXT_PREFS;
  return {
    scale: typeof v.scale === "number" && Number.isFinite(v.scale) ? clampScale(v.scale) : d.scale,
    align: v.align === "left" || v.align === "center" ? v.align : d.align,
    font: PLAY_FONT_ORDER.includes(v.font as PlayTextFont) ? (v.font as PlayTextFont) : d.font,
    updatedAt: typeof v.updatedAt === "number" && Number.isFinite(v.updatedAt) ? v.updatedAt : 0,
  };
}

/**
 * CSS-класс шрифта для блока. Табы всегда моноширинные — иначе разъезжаются;
 * аккорды и текст — как выбрано (в «Авто» аккорды моно, текст обычный).
 */
export function playFontClass(font: PlayTextFont, kind: "chords" | "tabs" | "lyrics"): string {
  if (kind === "tabs") return "font-mono";
  if (font === "auto") return kind === "chords" ? "font-mono" : "font-sans";
  return { mono: "font-mono", sans: "font-sans", serif: "font-serif" }[font];
}

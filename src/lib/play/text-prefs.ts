/** Настройки текста в режиме «Играем» — свои у каждого пользователя. */
export type PlayTextAlign = "center" | "left";
/** auto: аккорды и табы моноширинным, текст песни — шрифтом сайта */
export type PlayTextFont = "auto" | "golos" | "inter" | "roboto-condensed" | "nunito" | "jetbrains";

export interface PlayTextPrefs {
  /** Множитель размера шрифта, 0.4–2.5 */
  scale: number;
  align: PlayTextAlign;
  font: PlayTextFont;
  /** Когда меняли (мс) — побеждает более свежая запись: браузер или профиль */
  updatedAt: number;
}

export const PLAY_SCALE_MIN = 0.4;
export const PLAY_SCALE_MAX = 2.5;
export const PLAY_SCALE_STEP = 0.1;

export const DEFAULT_PLAY_TEXT_PREFS: PlayTextPrefs = {
  scale: 1,
  align: "center",
  font: "auto",
  updatedAt: 0,
};

/** Шрифты для меню: подпись, пояснение, моноширинный ли (для аккордов над словами). */
export const PLAY_FONTS: { id: PlayTextFont; label: string; hint: string; mono?: boolean }[] = [
  { id: "auto", label: "Авто", hint: "Аккорды моноширинным, текст — шрифтом сайта" },
  { id: "golos", label: "Golos Text", hint: "Шрифт сайта, нейтральный" },
  { id: "inter", label: "Inter", hint: "Крупный, читается издалека" },
  { id: "roboto-condensed", label: "Roboto Condensed", hint: "Узкий — длинные строки не переносятся" },
  { id: "nunito", label: "Nunito", hint: "Округлый, мягкий" },
  { id: "jetbrains", label: "JetBrains Mono", hint: "Моноширинный — аккорды над словами", mono: true },
];

const FONT_IDS = PLAY_FONTS.map((f) => f.id);
/** Значения из первой версии настроек */
const LEGACY_FONTS: Record<string, PlayTextFont> = {
  mono: "jetbrains",
  sans: "golos",
  serif: "golos",
};

export function playFontLabel(font: PlayTextFont): string {
  return PLAY_FONTS.find((f) => f.id === font)?.label ?? "Авто";
}

export function clampScale(scale: number): number {
  const rounded = Math.round(scale * 10) / 10;
  return Math.min(PLAY_SCALE_MAX, Math.max(PLAY_SCALE_MIN, rounded));
}

function parseFont(value: unknown): PlayTextFont {
  if (FONT_IDS.includes(value as PlayTextFont)) return value as PlayTextFont;
  if (typeof value === "string" && value in LEGACY_FONTS) return LEGACY_FONTS[value];
  return DEFAULT_PLAY_TEXT_PREFS.font;
}

/** Из БД или localStorage — чужое и старое значение не должно ломать «Играем». */
export function parsePlayTextPrefs(value: unknown): PlayTextPrefs {
  const v = (value && typeof value === "object" ? value : {}) as Partial<PlayTextPrefs>;
  const d = DEFAULT_PLAY_TEXT_PREFS;
  return {
    scale: typeof v.scale === "number" && Number.isFinite(v.scale) ? clampScale(v.scale) : d.scale,
    align: v.align === "left" || v.align === "center" ? v.align : d.align,
    font: parseFont(v.font),
    updatedAt: typeof v.updatedAt === "number" && Number.isFinite(v.updatedAt) ? v.updatedAt : 0,
  };
}

/** Какой шрифт у блока: выбранный, либо моноширинный/обычный сайта. */
export type ResolvedPlayFont = Exclude<PlayTextFont, "auto"> | "site-mono" | "site-sans";

/**
 * Табы всегда моноширинные — иначе разъезжаются; аккорды и текст — как выбрано
 * (в «Авто» аккорды моноширинным, текст — шрифтом сайта).
 */
export function resolvePlayFont(font: PlayTextFont, kind: "chords" | "tabs" | "lyrics"): ResolvedPlayFont {
  if (kind === "tabs") return font === "jetbrains" ? "jetbrains" : "site-mono";
  if (font === "auto") return kind === "chords" ? "site-mono" : "site-sans";
  return font;
}

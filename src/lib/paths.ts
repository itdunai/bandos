/** Служебные URL приложения — нельзя использовать как slug группы. */
export const RESERVED_BAND_SLUGS = new Set([
  "admin",
  "login",
  "register",
  "new-band",
  "api",
  "auth",
  "invite",
  "media",
  "rider",
  "repertoire",
]);

export function isReservedBandSlug(slug: string): boolean {
  return RESERVED_BAND_SLUGS.has(slug.toLowerCase());
}

/**
 * Безопасный путь к разделу группы.
 * encodeURIComponent нужен для redirect() — кириллица в Location ломает Node.js.
 */
export function bandPath(slug: string, ...segments: string[]): string {
  const parts = [slug, ...segments].map((s) => encodeURIComponent(s));
  return `/${parts.join("/")}`;
}

export function decodeBandSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Разделы, где баннер ближайшего события не показывается (первый сегмент после slug группы). */
const UPCOMING_BANNER_HIDDEN_SECTIONS = new Set([
  "finances",
  "songs",
  "setlists",
  "metronome",
  "play",
]);

export function isUpcomingBannerHiddenPath(pathname: string): boolean {
  const section = pathname.split("/").filter(Boolean)[1];
  if (!section) return false;
  return UPCOMING_BANNER_HIDDEN_SECTIONS.has(decodeBandSlug(section));
}

/** Служебные URL приложения — нельзя использовать как slug группы. */
export const RESERVED_BAND_SLUGS = new Set([
  "admin",
  "forbidden",
  "login",
  "register",
  "new-band",
  "api",
  "auth",
  "invite",
  "media",
  "rider",
  "repertoire",
  "privacy",
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

import { BAND_MEDIA_BUCKET } from "@/lib/storage";

const PUBLIC_MARKER = `/storage/v1/object/public/${BAND_MEDIA_BUCKET}/`;

const LOCAL_PREFIX = "/media/";

export function isLocalMediaUrl(url: string) {
  return url.startsWith(LOCAL_PREFIX);
}

export function isSupabaseMediaUrl(url: string) {
  return url.includes(PUBLIC_MARKER);
}

export function stripCacheParam(url: string) {
  return url.split("?")[0] ?? url;
}

export function pathFromSupabasePublicUrl(url: string): string | null {
  const clean = stripCacheParam(url);
  const idx = clean.indexOf(PUBLIC_MARKER);
  if (idx === -1) return null;
  return decodeURIComponent(clean.slice(idx + PUBLIC_MARKER.length));
}

export function displayUrlWithCacheBust(url: string) {
  const clean = stripCacheParam(url);
  return `${clean}?v=${Date.now()}`;
}

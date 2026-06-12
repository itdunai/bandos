const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

/** Normalize and validate external URLs (http/https only). */
export function sanitizeExternalUrl(
  url: string | null | undefined
): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    if (!SAFE_PROTOCOLS.has(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function sanitizeHref(
  url: string | null | undefined
): string | undefined {
  return sanitizeExternalUrl(url) ?? undefined;
}

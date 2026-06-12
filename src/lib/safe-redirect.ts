/** Allow only same-origin relative paths for post-auth redirects. */
export function sanitizeRedirectPath(
  next: string | null | undefined
): string | null {
  if (!next) return null;

  let path: string;
  try {
    path = decodeURIComponent(next.trim());
  } catch {
    return null;
  }

  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return null;
  }

  if (/^\/[a-z][a-z0-9+.-]*:/i.test(path)) {
    return null;
  }

  if (!/^\/[A-Za-z0-9/._?&=%\-~]*$/.test(path)) {
    return null;
  }

  return path;
}

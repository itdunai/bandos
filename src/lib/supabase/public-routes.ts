/** Страницы, доступные без входа. Остальное proxy отправляет на /login. */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/rider/") ||
    pathname.startsWith("/repertoire/") ||
    pathname === "/account/deleted" ||
    pathname === "/privacy" ||
    pathname.startsWith("/privacy/")
  );
}

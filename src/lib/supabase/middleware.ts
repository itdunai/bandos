import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/rider/") ||
    pathname.startsWith("/repertoire/");

  const isNewBandRoute = pathname === "/new-band";

  if (!user && !isPublicRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // pathname может содержать кириллицу — кодируем для Location
    url.searchParams.set("next", encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  if (!user && isNewBandRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", "/new-band");
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Уже вошёл — не нужна страница регистрации по приглашению
  if (user && /^\/invite\/[^/]+\/join$/.test(pathname)) {
    const token = pathname.split("/")[2];
    const url = request.nextUrl.clone();
    url.pathname = `/invite/${token}`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

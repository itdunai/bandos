import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPublicPath } from "@/lib/supabase/public-routes";

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
  const isNewBandRoute = pathname === "/new-band";

  if (!user && !isPublicPath(pathname)) {
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

  // Активность для метрики (DAU/удержание): раз в сутки на браузер — кука с датой
  if (user) {
    const today = new Date().toISOString().slice(0, 10);
    if (request.cookies.get(ACTIVITY_COOKIE)?.value !== today) {
      try {
        await supabase.rpc("touch_activity");
      } catch {
        // метрика не должна мешать открыть страницу
      }
      supabaseResponse.cookies.set(ACTIVITY_COOKIE, today, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 48,
      });
    }
  }

  return supabaseResponse;
}

const ACTIVITY_COOKIE = "bandos_seen";

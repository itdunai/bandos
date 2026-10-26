import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }
  return await updateSession(request);
}

// robots.txt, sitemap.xml, manifest, sw.js — публичные файлы для поисковиков и PWA.
// api/telegram и api/cron вызываются без сессии (Telegram, планировщик) и
// проверяют доступ сами — по секрету в заголовке.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|sw.js|api/health|api/telegram|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { isCronAuthorized } from "@/lib/telegram/cron-auth";
import { diagnoseTelegram } from "@/lib/telegram/diag";

export const dynamic = "force-dynamic";

/** Диагностика связи сервера с Telegram. Защищено CRON_SECRET (то же есть в /admin). */
export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  return Response.json(await diagnoseTelegram());
}

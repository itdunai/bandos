import { isCronAuthorized } from "@/lib/telegram/cron-auth";
import { registerTelegramWebhook } from "@/lib/telegram/diag";

export const dynamic = "force-dynamic";

/** Настройка бота: webhook и список команд. Защищено CRON_SECRET (то же есть в /admin). */
export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const result = await registerTelegramWebhook();
  return Response.json(result, { status: result.ok ? 200 : 500 });
}

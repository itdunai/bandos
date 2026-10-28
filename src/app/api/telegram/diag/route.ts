import { callTelegram, telegramApiBase, telegramBotToken } from "@/lib/telegram/bot";
import { isCronAuthorized } from "@/lib/telegram/cron-auth";

export const dynamic = "force-dynamic";

/**
 * Диагностика связи сервера с Telegram (защищено CRON_SECRET):
 * доступен ли Bot API с хостинга, сколько занимает запрос, что Telegram пишет о webhook.
 */
export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const started = Date.now();
  const me = await callTelegram<{ username?: string }>("getMe");
  const getMeMs = Date.now() - started;
  const webhook = me.ok
    ? await callTelegram<{
        url?: string;
        pending_update_count?: number;
        last_error_date?: number;
        last_error_message?: string;
      }>("getWebhookInfo")
    : null;

  const info = webhook?.result;
  return Response.json({
    ok: me.ok,
    apiBase: telegramApiBase(),
    tokenConfigured: !!telegramBotToken(),
    botUsernameEnv: process.env.TELEGRAM_BOT_USERNAME?.trim() || null,
    getMe: me.ok
      ? { ok: true, username: me.result?.username, ms: getMeMs }
      : { ok: false, error: me.description, ms: getMeMs },
    webhook: info
      ? {
          url: info.url,
          pending: info.pending_update_count,
          lastError: info.last_error_message ?? null,
          lastErrorAt: info.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : null,
        }
      : null,
  });
}

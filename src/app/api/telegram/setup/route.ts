import { getSiteUrl } from "@/lib/site-url";
import { callTelegram, telegramWebhookSecret } from "@/lib/telegram/bot";
import { isCronAuthorized } from "@/lib/telegram/cron-auth";

export const dynamic = "force-dynamic";

/** Однократная настройка бота: webhook и список команд. Защищено CRON_SECRET. */
export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const secret = telegramWebhookSecret();
  if (!secret) {
    return Response.json(
      { ok: false, error: "TELEGRAM_WEBHOOK_SECRET не задан (16+ символов: A-Z a-z 0-9 _ -)" },
      { status: 500 }
    );
  }

  const url = `${getSiteUrl().replace(/\/$/, "")}/api/telegram/webhook`;
  const webhook = await callTelegram("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });
  const commands = await callTelegram("setMyCommands", {
    commands: [
      { command: "start", description: "Подключить уведомления BandOS" },
      { command: "status", description: "Статус подключения" },
      { command: "stop", description: "Отключить уведомления" },
    ],
  });

  return Response.json({
    ok: webhook.ok && commands.ok,
    webhookUrl: url,
    webhook: webhook.description ?? webhook.ok,
    commands: commands.description ?? commands.ok,
  });
}

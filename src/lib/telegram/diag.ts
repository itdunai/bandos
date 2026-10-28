import { getSiteUrl } from "@/lib/site-url";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import {
  callTelegram,
  telegramApiBase,
  telegramBotToken,
  telegramWebhookSecret,
} from "@/lib/telegram/bot";

export interface TelegramDiagnostics {
  checkedAt: string;
  config: { name: string; ok: boolean; hint?: string }[];
  apiBase: string;
  expectedWebhookUrl: string;
  viaProxy: boolean;
  getMe: { ok: boolean; username?: string; error?: string; ms: number };
  webhook: {
    url: string | null;
    matches: boolean;
    pending: number;
    lastError: string | null;
    lastErrorAt: string | null;
  } | null;
  linkedAccounts: number | null;
  sent24h: number | null;
}

/** Адрес webhook сайта (куда в итоге должны попадать сообщения). */
export function siteWebhookUrl(): string {
  return `${getSiteUrl().replace(/\/$/, "")}/api/telegram/webhook`;
}

/**
 * Адрес, который регистрируется в Telegram. По умолчанию — webhook сайта; если
 * Telegram не может достучаться до хостинга, TELEGRAM_WEBHOOK_URL указывает на
 * прокси (Cloudflare Worker), который пересылает сообщения на сайт.
 */
export function expectedWebhookUrl(): string {
  const raw = process.env.TELEGRAM_WEBHOOK_URL?.trim();
  if (raw) {
    try {
      const url = new URL(raw);
      if (url.protocol === "https:") return url.toString();
    } catch {
      // некорректный адрес — используем webhook сайта
    }
  }
  return siteWebhookUrl();
}

/** Полная проверка бота: настройки сервера, связь с Bot API, состояние webhook. */
export async function diagnoseTelegram(): Promise<TelegramDiagnostics> {
  const config = [
    { name: "TELEGRAM_BOT_TOKEN", ok: !!telegramBotToken(), hint: "токен от @BotFather" },
    {
      name: "SUPABASE_SERVICE_ROLE_KEY",
      ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
      hint: "нужен webhook и рассылке",
    },
    {
      name: "TELEGRAM_WEBHOOK_SECRET",
      ok: !!telegramWebhookSecret(),
      hint: "16+ символов: A-Z a-z 0-9 _ -",
    },
    { name: "CRON_SECRET", ok: (process.env.CRON_SECRET?.trim().length ?? 0) >= 16, hint: "16+ символов" },
    {
      name: "TELEGRAM_WEBHOOK_URL",
      ok: !!process.env.TELEGRAM_WEBHOOK_URL?.trim(),
      hint: "необязательно: прокси для входящих, если Telegram не достаёт до хостинга",
    },
    {
      name: "TELEGRAM_BOT_USERNAME",
      ok: !!process.env.TELEGRAM_BOT_USERNAME?.trim(),
      hint: "необязательно, но без него ссылка «Подключить» зависит от связи с Telegram",
    },
  ];

  const started = Date.now();
  const me = await callTelegram<{ username?: string }>("getMe");
  const getMe = me.ok
    ? { ok: true, username: me.result?.username, ms: Date.now() - started }
    : { ok: false, error: me.description, ms: Date.now() - started };

  let webhook: TelegramDiagnostics["webhook"] = null;
  if (me.ok) {
    const info = await callTelegram<{
      url?: string;
      pending_update_count?: number;
      last_error_date?: number;
      last_error_message?: string;
    }>("getWebhookInfo");
    if (info.ok && info.result) {
      const r = info.result;
      webhook = {
        url: r.url || null,
        matches: r.url === expectedWebhookUrl(),
        pending: r.pending_update_count ?? 0,
        lastError: r.last_error_message ?? null,
        lastErrorAt: r.last_error_date ? new Date(r.last_error_date * 1000).toISOString() : null,
      };
    }
  }

  let linkedAccounts: number | null = null;
  let sent24h: number | null = null;
  const db = createServiceSupabaseClient();
  if (db) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [accounts, sent] = await Promise.all([
      db.from("telegram_accounts").select("user_id", { count: "exact", head: true }),
      db.from("notification_log").select("user_id", { count: "exact", head: true }).gte("sent_at", since),
    ]);
    linkedAccounts = accounts.count ?? null;
    sent24h = sent.count ?? null;
  }

  return {
    checkedAt: new Date().toISOString(),
    config,
    apiBase: telegramApiBase(),
    expectedWebhookUrl: expectedWebhookUrl(),
    viaProxy: expectedWebhookUrl() !== siteWebhookUrl(),
    getMe,
    webhook,
    linkedAccounts,
    sent24h,
  };
}

/** Регистрирует webhook (с секретом) и меню команд бота. */
export async function registerTelegramWebhook(): Promise<{ ok: boolean; message: string }> {
  const secret = telegramWebhookSecret();
  if (!secret) return { ok: false, message: "TELEGRAM_WEBHOOK_SECRET не задан (16+ символов: A-Z a-z 0-9 _ -)" };

  const webhook = await callTelegram("setWebhook", {
    url: expectedWebhookUrl(),
    secret_token: secret,
    allowed_updates: ["message"],
  });
  if (!webhook.ok) return { ok: false, message: `setWebhook: ${webhook.description ?? "ошибка"}` };

  const commands = await callTelegram("setMyCommands", {
    commands: [
      { command: "start", description: "Подключить уведомления BandOS" },
      { command: "status", description: "Статус подключения" },
      { command: "stop", description: "Отключить уведомления" },
    ],
  });
  return commands.ok
    ? { ok: true, message: `Webhook: ${expectedWebhookUrl()}` }
    : { ok: false, message: `setMyCommands: ${commands.description ?? "ошибка"}` };
}

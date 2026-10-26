import { timingSafeEqual } from "node:crypto";

/** Минимальная обёртка над Telegram Bot API (без зависимостей). */

const API = "https://api.telegram.org";

export function telegramBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

export function isTelegramConfigured(): boolean {
  return !!telegramBotToken() && !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
}

export interface TelegramResult<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

export async function callTelegram<T = unknown>(
  method: string,
  payload: Record<string, unknown> = {}
): Promise<TelegramResult<T>> {
  const token = telegramBotToken();
  if (!token) return { ok: false, description: "TELEGRAM_BOT_TOKEN не задан" };

  try {
    const res = await fetch(`${API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return (await res.json()) as TelegramResult<T>;
  } catch (e) {
    return { ok: false, description: e instanceof Error ? e.message : "fetch failed" };
  }
}

export function sendTelegramMessage(chatId: number, html: string) {
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text: html,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
}

let cachedUsername: string | null = null;

/** Имя бота для ссылок t.me/<bot>: из TELEGRAM_BOT_USERNAME или getMe. */
export async function getBotUsername(): Promise<string | null> {
  const fromEnv = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  if (fromEnv) return fromEnv;
  if (cachedUsername) return cachedUsername;
  const me = await callTelegram<{ username?: string }>("getMe");
  cachedUsername = me.ok ? me.result?.username ?? null : null;
  return cachedUsername;
}

/** Экранирование для parse_mode=HTML. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Секрет для заголовка X-Telegram-Bot-Api-Secret-Token (A-Z, a-z, 0-9, _ и -). */
export function telegramWebhookSecret(): string | null {
  const s = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  return s && /^[A-Za-z0-9_-]{16,256}$/.test(s) ? s : null;
}

/** Сравнение секретов за постоянное время. */
export function secretsEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

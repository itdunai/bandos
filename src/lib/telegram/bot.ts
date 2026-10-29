import { timingSafeEqual } from "node:crypto";
import { captureServerError } from "@/lib/monitoring/sentry";

/** Минимальная обёртка над Telegram Bot API (без зависимостей). */

const DEFAULT_API = "https://api.telegram.org";

/**
 * Базовый адрес Bot API. Можно переопределить TELEGRAM_API_BASE — например, если
 * с хостинга api.telegram.org недоступен и запросы идут через прокси.
 */
export function telegramApiBase(): string {
  const raw = process.env.TELEGRAM_API_BASE?.trim();
  if (!raw) return DEFAULT_API;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.origin + url.pathname.replace(/\/$/, "") : DEFAULT_API;
  } catch {
    return DEFAULT_API;
  }
}

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
    const res = await fetch(`${telegramApiBase()}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return (await res.json()) as TelegramResult<T>;
  } catch (e) {
    // Сетевой сбой (таймаут, блокировка) — не ответ Telegram. Фиксируем, чтобы было видно в Sentry.
    const description = e instanceof Error ? `${e.name}: ${e.message}` : "fetch failed";
    captureServerError(e, { action: `telegram.${method}`, extras: { apiBase: telegramApiBase() } });
    return { ok: false, description, error_code: 0 };
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

/** Файл в чат (multipart). Лимит Bot API — 50 МБ. */
export async function sendTelegramDocument(
  chatId: number,
  file: { name: string; data: Buffer },
  captionHtml?: string
): Promise<TelegramResult<unknown>> {
  const token = telegramBotToken();
  if (!token) return { ok: false, description: "TELEGRAM_BOT_TOKEN не задан" };

  const form = new FormData();
  form.set("chat_id", String(chatId));
  form.set("document", new Blob([new Uint8Array(file.data)]), file.name);
  if (captionHtml) {
    form.set("caption", captionHtml);
    form.set("parse_mode", "HTML");
  }

  try {
    const res = await fetch(`${telegramApiBase()}/bot${token}/sendDocument`, {
      method: "POST",
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    });
    return (await res.json()) as TelegramResult<unknown>;
  } catch (e) {
    const description = e instanceof Error ? `${e.name}: ${e.message}` : "fetch failed";
    captureServerError(e, { action: "telegram.sendDocument", extras: { apiBase: telegramApiBase() } });
    return { ok: false, description, error_code: 0 };
  }
}

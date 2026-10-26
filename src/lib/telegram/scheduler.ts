import { captureServerError } from "@/lib/monitoring/sentry";
import { isTelegramConfigured } from "@/lib/telegram/bot";

const INTERVAL_MS = 10 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 60 * 1000;

const g = globalThis as typeof globalThis & { __bandosReminderTimer?: NodeJS.Timeout };

/**
 * Встроенный планировщик напоминаний: сервер сам раз в 10 минут проходит по
 * событиям и делам. Внешний cron не нужен. Если серверов несколько — дубли
 * отсекает notification_log. Отключить: TELEGRAM_SCHEDULER=off (например,
 * если вызываете POST /api/cron/reminders снаружи).
 */
export function startReminderScheduler() {
  const mode = process.env.TELEGRAM_SCHEDULER?.trim();
  if (mode === "off") return;
  if (process.env.NODE_ENV !== "production" && mode !== "on") return;
  if (!isTelegramConfigured() || g.__bandosReminderTimer) return;

  const tick = async () => {
    try {
      const { runReminders } = await import("@/lib/telegram/notify");
      await runReminders();
    } catch (error) {
      captureServerError(error, { action: "telegram.reminders" });
    }
  };

  const first = setTimeout(() => void tick(), FIRST_RUN_DELAY_MS);
  first.unref?.();
  g.__bandosReminderTimer = setInterval(() => void tick(), INTERVAL_MS);
  g.__bandosReminderTimer.unref?.();
}

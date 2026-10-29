import { captureServerError } from "@/lib/monitoring/sentry";

const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const FIRST_CHECK_DELAY_MS = 5 * 60 * 1000;
const MIN_GAP_MS = 20 * 60 * 60 * 1000;

const g = globalThis as typeof globalThis & {
  __bandosBackupTimer?: NodeJS.Timeout;
  __bandosBackupRunning?: boolean;
};

/**
 * Ежедневная автокопия БД админам в Telegram. Раз в час проверяет, была ли копия
 * за последние 20 часов (по журналу), — переживает перезапуски и не дублирует.
 * Включается сама, когда заданы SUPABASE_DB_URL, BACKUP_PASSPHRASE и бот.
 * Отключить: BACKUP_SCHEDULER=off.
 */
export function startBackupScheduler() {
  if (process.env.BACKUP_SCHEDULER?.trim() === "off") return;
  if (process.env.NODE_ENV !== "production") return;
  if (g.__bandosBackupTimer) return;

  const tick = async () => {
    if (g.__bandosBackupRunning) return;
    try {
      const { isAutoBackupConfigured, lastBackupAt, runTelegramBackup } = await import(
        "@/lib/backup/job"
      );
      if (!isAutoBackupConfigured()) return;
      const last = await lastBackupAt();
      if (last && Date.now() - new Date(last).getTime() < MIN_GAP_MS) return;

      g.__bandosBackupRunning = true;
      await runTelegramBackup("schedule");
    } catch (error) {
      captureServerError(error, { action: "backup.scheduler" });
    } finally {
      g.__bandosBackupRunning = false;
    }
  };

  const first = setTimeout(() => void tick(), FIRST_CHECK_DELAY_MS);
  first.unref?.();
  g.__bandosBackupTimer = setInterval(() => void tick(), CHECK_INTERVAL_MS);
  g.__bandosBackupTimer.unref?.();
}

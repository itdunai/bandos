import {
  backupDatabaseUrl,
  backupFileName,
  backupPassphrase,
  createDatabaseDump,
  encryptBackup,
} from "@/lib/backup/pg-dump";
import { captureServerError } from "@/lib/monitoring/sentry";
import { logPlatformEvent } from "@/lib/platform/audit";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { isTelegramConfigured, sendTelegramDocument } from "@/lib/telegram/bot";

const TELEGRAM_FILE_LIMIT = 50 * 1024 * 1024;

export interface BackupSetup {
  databaseUrl: boolean;
  passphrase: boolean;
  telegram: boolean;
}

export function backupSetup(): BackupSetup {
  return {
    databaseUrl: !!backupDatabaseUrl(),
    passphrase: !!backupPassphrase(),
    telegram: isTelegramConfigured(),
  };
}

/** Автокопия возможна: есть БД, пароль шифрования и бот. */
export function isAutoBackupConfigured() {
  const s = backupSetup();
  return s.databaseUrl && s.passphrase && s.telegram;
}

async function adminChatIds(): Promise<number[]> {
  const db = createServiceSupabaseClient();
  if (!db) return [];
  const { data: admins } = await db.from("profiles").select("id").eq("is_platform_admin", true);
  const ids = (admins ?? []).map((a) => a.id as string);
  if (!ids.length) return [];
  const { data: accounts } = await db.from("telegram_accounts").select("chat_id").in("user_id", ids);
  return (accounts ?? []).map((a) => a.chat_id as number).filter(Boolean);
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} МБ`;

/**
 * Дамп → шифрование → админам платформы в Telegram (копия вне сервера и Supabase).
 * Результат пишется в журнал: backup.created / backup.failed.
 */
export async function runTelegramBackup(trigger: "schedule" | "manual") {
  const passphrase = backupPassphrase();
  try {
    if (!passphrase) throw new Error("BACKUP_PASSPHRASE не задан (минимум 12 символов)");
    if (!isTelegramConfigured()) throw new Error("Telegram-бот не настроен");
    const chatIds = await adminChatIds();
    if (!chatIds.length) throw new Error("Ни у одного админа платформы не подключён Telegram");

    const startedAt = Date.now();
    const dump = await createDatabaseDump();
    const encrypted = encryptBackup(dump, passphrase);
    if (encrypted.length > TELEGRAM_FILE_LIMIT) {
      throw new Error(`Копия ${mb(encrypted.length)} больше лимита Telegram 50 МБ — скачивайте из админки`);
    }

    const name = backupFileName(new Date(), true);
    const caption = `🗄 <b>Резервная копия BandOS</b>\n${mb(encrypted.length)} · зашифрована`;
    const results = await Promise.all(
      chatIds.map((id) => sendTelegramDocument(id, { name, data: encrypted }, caption))
    );
    const delivered = results.filter((r) => r.ok).length;
    if (!delivered) throw new Error(results[0]?.description ?? "Telegram не принял файл");

    await logPlatformEvent({
      level: "info",
      event: "backup.created",
      meta: {
        trigger,
        file: name,
        bytes: encrypted.length,
        seconds: Math.round((Date.now() - startedAt) / 1000),
        delivered,
      },
    });
    return { ok: true as const, file: name, bytes: encrypted.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    captureServerError(error, { action: "backup.telegram", extras: { trigger } });
    await logPlatformEvent({ level: "error", event: "backup.failed", meta: { trigger, message } });
    return { ok: false as const, error: message };
  }
}

/** Последняя удачная копия (по журналу) — для админки и планировщика. */
async function lastBackupEvent() {
  const db = createServiceSupabaseClient();
  if (!db) return null;
  const { data } = await db
    .from("platform_audit_log")
    .select("created_at, meta")
    .eq("event", "backup.created")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as { created_at: string; meta: Record<string, unknown> | null } | null;
}

export async function lastBackupAt(): Promise<string | null> {
  return (await lastBackupEvent())?.created_at ?? null;
}

/**
 * Для админки: когда была копия, не пора ли беспокоиться (больше 26 ч)
 * и ссылка на workflow, если копии делает GitHub Actions.
 */
export async function backupStatus() {
  const event = await lastBackupEvent();
  const last = event?.created_at ?? null;
  const stale = !last || Date.now() - new Date(last).getTime() > 26 * 60 * 60 * 1000;
  const runUrl = typeof event?.meta?.runUrl === "string" ? event.meta.runUrl : null;
  // https://github.com/<owner>/<repo>/actions/runs/<id> → страница workflow с кнопкой Run
  const workflowUrl = runUrl?.replace(/\/runs\/\d+.*$/, "/workflows/db-backup.yml") ?? null;
  return { last, stale, viaGithub: event?.meta?.trigger === "github", runUrl, workflowUrl };
}

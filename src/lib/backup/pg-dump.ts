import { spawn, type ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/**
 * Резервная копия БД без платного тарифа Supabase: pg_dump с сервера приложения.
 * Нужен SUPABASE_DB_URL (строка подключения Session pooler из Supabase → Connect)
 * и pg_dump в контейнере (ставится в Dockerfile).
 */

const DUMP_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_DUMP_BYTES = 500 * 1024 * 1024;
const DEFAULT_SCHEMAS = ["public", "auth", "storage"];

export function backupDatabaseUrl(): string | null {
  return process.env.SUPABASE_DB_URL?.trim() || null;
}

export function backupPassphrase(): string | null {
  const p = process.env.BACKUP_PASSPHRASE?.trim();
  return p && p.length >= 12 ? p : null;
}

function backupSchemas(): string[] {
  const raw = process.env.BACKUP_SCHEMAS?.trim();
  const list = raw ? raw.split(",").map((s) => s.trim()) : DEFAULT_SCHEMAS;
  return list.filter((s) => /^[a-z_][a-z0-9_]*$/.test(s));
}

/**
 * Параметры подключения — через переменные окружения libpq, а не аргументом:
 * так пароль не виден в списке процессов.
 */
export function pgEnvFromUrl(url: string): Record<string, string> {
  const u = new URL(url);
  if (u.protocol !== "postgres:" && u.protocol !== "postgresql:") {
    throw new Error("SUPABASE_DB_URL должен начинаться с postgresql://");
  }
  return {
    PGHOST: u.hostname,
    PGPORT: u.port || "5432",
    PGUSER: decodeURIComponent(u.username),
    PGPASSWORD: decodeURIComponent(u.password),
    PGDATABASE: decodeURIComponent(u.pathname.replace(/^\//, "")) || "postgres",
    PGSSLMODE: u.searchParams.get("sslmode") || "require",
  };
}

function run(args: string[], env: Record<string, string> = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child: ChildProcessByStdio<null, Readable, Readable> = spawn("pg_dump", args, {
      // Только PATH и libpq — секреты приложения процессу pg_dump не нужны
      env: { NODE_ENV: process.env.NODE_ENV, PATH: process.env.PATH ?? "", ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const chunks: Buffer[] = [];
    let size = 0;
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("pg_dump: превышено время ожидания"));
    }, DUMP_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_DUMP_BYTES) {
        child.kill("SIGKILL");
        return;
      }
      chunks.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-2000);
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(
        (e as NodeJS.ErrnoException).code === "ENOENT"
          ? new Error("pg_dump не установлен на сервере")
          : e
      );
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (size > MAX_DUMP_BYTES) return reject(new Error("Дамп больше 500 МБ — нужен другой способ"));
      if (code !== 0) return reject(new Error(`pg_dump завершился с кодом ${code}: ${stderr.trim()}`));
      resolve(Buffer.concat(chunks));
    });
  });
}

/** Версия pg_dump или null, если его нет. */
export async function pgDumpVersion(): Promise<string | null> {
  try {
    return (await run(["--version"])).toString().trim();
  } catch {
    return null;
  }
}

/** Дамп в формате custom (сжатый, для pg_restore). */
export async function createDatabaseDump(): Promise<Buffer> {
  const url = backupDatabaseUrl();
  if (!url) throw new Error("SUPABASE_DB_URL не задан");
  const schemas = backupSchemas().map((s) => `--schema=${s}`);
  return run(["--format=custom", "--no-owner", "--no-privileges", ...schemas], pgEnvFromUrl(url));
}

export function backupFileName(date = new Date(), encrypted = false) {
  const stamp = date.toISOString().slice(0, 16).replace("T", "-").replace(":", "");
  return `bandos-${stamp}.dump${encrypted ? ".enc" : ""}`;
}

// --- Шифрование для копий, которые уходят из сервера (Telegram) -----------------
// Формат: "BANDOSB1" | salt(16) | iv(12) | tag(16) | данные (AES-256-GCM, ключ scrypt).
// Расшифровка: node scripts/decrypt-backup.mjs <файл> (см. docs/backups.md).

const MAGIC = Buffer.from("BANDOSB1");
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function deriveKey(passphrase: string, salt: Buffer) {
  return scryptSync(passphrase, salt, 32, SCRYPT);
}

export function encryptBackup(data: Buffer, passphrase: string): Buffer {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(passphrase, salt), iv);
  const body = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([MAGIC, salt, iv, cipher.getAuthTag(), body]);
}

export function decryptBackup(file: Buffer, passphrase: string): Buffer {
  if (!file.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error("Это не зашифрованный бекап BandOS");
  let o = MAGIC.length;
  const salt = file.subarray(o, (o += 16));
  const iv = file.subarray(o, (o += 12));
  const tag = file.subarray(o, (o += 16));
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(passphrase, salt), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(file.subarray(o)), decipher.final()]);
}

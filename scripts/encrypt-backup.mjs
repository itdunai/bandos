#!/usr/bin/env node
// Шифрование дампа для хранения вне сервера (GitHub Actions → Telegram админам).
//   BACKUP_PASSPHRASE='…' node scripts/encrypt-backup.mjs bandos.dump   → bandos.dump.enc
// Формат совпадает с src/lib/backup/pg-dump.ts; расшифровка — scripts/decrypt-backup.mjs.
import { createCipheriv, randomBytes, scryptSync } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const [input, output = `${input}.enc`] = process.argv.slice(2);
const passphrase = process.env.BACKUP_PASSPHRASE;

if (!input || !passphrase || passphrase.length < 12) {
  console.error(
    "Использование: BACKUP_PASSPHRASE='…(от 12 символов)' node scripts/encrypt-backup.mjs <файл.dump> [выход]"
  );
  process.exit(1);
}

const salt = randomBytes(16);
const iv = randomBytes(12);
const key = scryptSync(passphrase, salt, 32, { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
const cipher = createCipheriv("aes-256-gcm", key, iv);
const body = Buffer.concat([cipher.update(readFileSync(input)), cipher.final()]);
writeFileSync(output, Buffer.concat([Buffer.from("BANDOSB1"), salt, iv, cipher.getAuthTag(), body]));
console.log(`Зашифровано: ${output}`);

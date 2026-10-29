#!/usr/bin/env node
// Расшифровка резервной копии BandOS из Telegram (*.dump.enc → *.dump).
// Использование:
//   BACKUP_PASSPHRASE='…' node scripts/decrypt-backup.mjs bandos-2026-10-29-0305.dump.enc
// Формат — см. src/lib/backup/pg-dump.ts: "BANDOSB1" | salt | iv | tag | AES-256-GCM.
import { createDecipheriv, scryptSync } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const [input, output = input?.replace(/\.enc$/, "")] = process.argv.slice(2);
const passphrase = process.env.BACKUP_PASSPHRASE;

if (!input || !passphrase || output === input) {
  console.error("Использование: BACKUP_PASSPHRASE='…' node scripts/decrypt-backup.mjs <файл.dump.enc> [выход.dump]");
  process.exit(1);
}

const file = readFileSync(input);
const magic = Buffer.from("BANDOSB1");
if (!file.subarray(0, magic.length).equals(magic)) {
  console.error("Это не зашифрованный бекап BandOS");
  process.exit(1);
}

let o = magic.length;
const salt = file.subarray(o, (o += 16));
const iv = file.subarray(o, (o += 12));
const tag = file.subarray(o, (o += 16));
const key = scryptSync(passphrase, salt, 32, { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });

try {
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const data = Buffer.concat([decipher.update(file.subarray(o)), decipher.final()]);
  writeFileSync(output, data);
  console.log(`Готово: ${output} (${(data.length / 1024 / 1024).toFixed(1)} МБ)`);
} catch {
  console.error("Не удалось расшифровать: неверный пароль или файл повреждён");
  process.exit(1);
}

import { BackupNowButton } from "@/components/admin/backup-now-button";
import { Card } from "@/components/ui/card";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { backupSetup, backupStatus } from "@/lib/backup/job";
import { pgDumpVersion } from "@/lib/backup/pg-dump";
import { cn } from "@/lib/utils";
import { CheckCircle2, Download, XCircle } from "lucide-react";

function Row({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green" />
      ) : (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red" />
      )}
      <span>
        {label}
        {hint && <span className="block text-xs text-text-muted">{hint}</span>}
      </span>
    </li>
  );
}

/** «Резервные копии» в /admin/system: готовность, последняя копия, ручной запуск. */
export async function BackupCard() {
  const setup = backupSetup();
  const [version, { last, stale }] = await Promise.all([pgDumpVersion(), backupStatus()]);
  const canDump = setup.databaseUrl && !!version;
  const auto = canDump && setup.passphrase && setup.telegram;

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm">
          Последняя автокопия:{" "}
          {last ? (
            <span className={cn("font-semibold", stale && "text-amber")}>
              <LocalDateTime
                value={last}
                options={{ day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }}
              />
            </span>
          ) : (
            <span className="font-semibold text-amber">ещё не было</span>
          )}
        </div>
        <span className="text-xs text-text-muted">
          {auto ? "Автокопия раз в сутки — админам в Telegram" : "Автокопия выключена"}
        </span>
      </div>

      <ul className="space-y-1.5">
        <Row
          ok={setup.databaseUrl}
          label="Подключение к БД (SUPABASE_DB_URL)"
          hint={setup.databaseUrl ? undefined : "Supabase → Connect → Session pooler"}
        />
        <Row
          ok={!!version}
          label={version ?? "pg_dump на сервере"}
          hint={version ? undefined : "Ставится в Docker-образе — пересоберите после деплоя"}
        />
        <Row
          ok={setup.passphrase}
          label="Пароль шифрования (BACKUP_PASSPHRASE)"
          hint={setup.passphrase ? undefined : "От 12 символов. Без него копии в Telegram не уходят"}
        />
        <Row
          ok={setup.telegram}
          label="Telegram-бот"
          hint="Копия уходит админам платформы, у которых подключён Telegram («Аккаунт»)"
        />
      </ul>

      <div className="flex flex-wrap gap-2">
        {canDump ? (
          // Скачивание файла из API-маршрута — обычная ссылка, не клиентская навигация
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a
            href="/api/admin/backup"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-strong px-3.5 text-sm font-semibold hover:border-accent hover:text-accent"
          >
            <Download className="h-4 w-4" />
            Скачать копию сейчас
          </a>
        ) : null}
        {auto && <BackupNowButton />}
      </div>
      <p className="text-xs text-text-muted">
        В копии — данные приложения и аккаунты (схемы public, auth, storage). Файлы (лого, фото,
        аватары) не входят. Восстановление — docs/backups.md.
      </p>
    </Card>
  );
}

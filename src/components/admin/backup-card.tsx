import { BackupNowButton } from "@/components/admin/backup-now-button";
import { Card } from "@/components/ui/card";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { backupSetup, backupStatus } from "@/lib/backup/job";
import { pgDumpVersion } from "@/lib/backup/pg-dump";
import { cn } from "@/lib/utils";
import { CheckCircle2, Download, ExternalLink, Info, XCircle } from "lucide-react";

function Row({ ok, label, hint }: { ok: boolean | "info"; label: string; hint?: string }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ok === "info" ? (
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue" />
      ) : ok ? (
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

/**
 * «Резервные копии» в /admin/system. Два способа: pg_dump на сервере (образ из
 * Dockerfile) или GitHub Actions (.github/workflows/db-backup.yml) — если на
 * хостинге pg_dump нет. Карточка показывает, какой работает.
 */
export async function BackupCard() {
  const setup = backupSetup();
  const [pgDump, status] = await Promise.all([pgDumpVersion(), backupStatus()]);
  const version = "version" in pgDump ? pgDump.version : null;
  const onServer = setup.databaseUrl && !!version;
  const serverAuto = onServer && setup.passphrase && setup.telegram;
  const linkClass =
    "inline-flex h-9 items-center gap-2 rounded-lg border border-border-strong px-3.5 text-sm font-semibold hover:border-accent hover:text-accent";

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm">
          Последняя копия:{" "}
          {status.last ? (
            <span className={cn("font-semibold", status.stale && "text-amber")}>
              <LocalDateTime
                value={status.last}
                options={{ day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }}
              />
            </span>
          ) : (
            <span className="font-semibold text-amber">ещё не было</span>
          )}
          {status.runUrl && (
            <a
              href={status.runUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-xs text-accent hover:underline"
            >
              запуск в GitHub
            </a>
          )}
        </div>
        <span className="text-xs text-text-muted">
          {serverAuto
            ? "Раз в сутки с сервера — админам в Telegram"
            : "Раз в сутки через GitHub Actions — админам в Telegram"}
        </span>
      </div>

      {onServer ? (
        <ul className="space-y-1.5">
          <Row ok label={version ?? "pg_dump"} />
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
      ) : (
        <ul className="space-y-1.5">
          <Row
            ok="info"
            label="На сервере нет pg_dump — копии делает GitHub Actions"
            hint="Секреты репозитория: SUPABASE_DB_URL, BACKUP_PASSPHRASE, TELEGRAM_BOT_TOKEN, SITE_URL, CRON_SECRET (docs/backups.md)"
          />
          <Row
            ok={!!status.last && !status.stale}
            label={
              status.last
                ? status.stale
                  ? "Копия старше суток — проверьте запуски в GitHub"
                  : "Ночные копии приходят"
                : "Отчётов о копиях пока не было"
            }
            hint={
              status.last
                ? undefined
                : "Запустите вручную: GitHub → Actions → DB backup → Run workflow"
            }
          />
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        {onServer ? (
          <>
            {/* Скачивание файла из API-маршрута — обычная ссылка, не клиентская навигация */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/admin/backup" className={linkClass}>
              <Download className="h-4 w-4" />
              Скачать копию сейчас
            </a>
            <BackupNowButton
              disabledReason={serverAuto ? undefined : "Не готово: пароль шифрования или Telegram-бот"}
            />
          </>
        ) : (
          status.workflowUrl && (
            <a href={status.workflowUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
              <ExternalLink className="h-4 w-4" />
              Запустить копию в GitHub
            </a>
          )
        )}
      </div>
      <p className="text-xs text-text-muted">
        В копии — данные приложения и аккаунты (схемы public, auth, storage). Файлы (лого, фото,
        аватары) не входят. Восстановление — docs/backups.md.
      </p>
    </Card>
  );
}

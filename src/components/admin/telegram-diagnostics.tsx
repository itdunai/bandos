import { Card } from "@/components/ui/card";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { diagnoseTelegram } from "@/lib/telegram/diag";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { TelegramDiagnosticsActions } from "./telegram-diagnostics-actions";

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-semibold", ok ? "text-green" : "text-red")}>
      {ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      {label}
    </span>
  );
}

/** Блок «Telegram-бот» в /admin: настройки, связь с Bot API, webhook, рассылка. */
export async function TelegramDiagnostics() {
  const d = await diagnoseTelegram();

  const webhookProblem =
    d.webhook && (!d.webhook.url || !d.webhook.matches || d.webhook.lastError);
  const verdict = !d.getMe.ok
    ? {
        tone: "red" as const,
        text: "Сервер не может связаться с Telegram. Уведомления не уходят, ссылка «Подключить» без TELEGRAM_BOT_USERNAME не работает.",
        hint: "Проверьте у хостинга доступ к api.telegram.org или задайте прокси в TELEGRAM_API_BASE.",
      }
    : webhookProblem
      ? {
          tone: "amber" as const,
          text: "Сервер связывается с Telegram, но Telegram не может доставить сообщения на сайт (webhook).",
          hint: !d.webhook?.matches
            ? "Webhook указывает не туда — нажмите «Перерегистрировать webhook»."
            : d.viaProxy
              ? "Telegram не дозванивается до прокси или прокси до сайта: проверьте Worker и WEBHOOK_TARGET."
              : "Telegram не дозванивается до сайта (сеть/файрвол хостинга). Можно пустить входящие через прокси: TELEGRAM_WEBHOOK_URL.",
        }
      : { tone: "green" as const, text: "Бот работает: связь с Telegram есть, webhook настроен.", hint: null };

  return (
    <Card className="space-y-5 p-5">
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg border p-4 text-sm",
          verdict.tone === "green" && "border-green/30 bg-green/10",
          verdict.tone === "amber" && "border-amber/30 bg-amber/10",
          verdict.tone === "red" && "border-red/30 bg-red/10"
        )}
      >
        {verdict.tone === "green" ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green" />
        ) : (
          <AlertTriangle className={cn("mt-0.5 h-5 w-5 shrink-0", verdict.tone === "red" ? "text-red" : "text-amber")} />
        )}
        <div>
          <p className="font-semibold">{verdict.text}</p>
          {verdict.hint && <p className="mt-1 text-text-secondary">{verdict.hint}</p>}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Связь с Bot API</dt>
            <dd className="text-right">
              {d.getMe.ok ? (
                <Status ok label={`@${d.getMe.username} · ${d.getMe.ms} мс`} />
              ) : (
                <Status ok={false} label={`нет · ${d.getMe.ms} мс`} />
              )}
            </dd>
          </div>
          {!d.getMe.ok && d.getMe.error && (
            <div className="rounded-md bg-bg-3 px-3 py-2 font-mono text-xs text-red">{d.getMe.error}</div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Адрес API</dt>
            <dd className="truncate font-mono text-xs">{d.apiBase}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Webhook</dt>
            <dd className="text-right">
              {d.webhook ? (
                <Status ok={!!d.webhook.url && d.webhook.matches} label={d.webhook.url ? (d.webhook.matches ? "настроен" : "другой адрес") : "не задан"} />
              ) : (
                <span className="text-text-muted">— (нет связи)</span>
              )}
            </dd>
          </div>
          {d.webhook?.url && d.webhook.matches && (
            <div className="truncate font-mono text-xs text-text-muted" title={d.webhook.url}>
              {d.viaProxy ? "через прокси: " : ""}
              {d.webhook.url}
            </div>
          )}
          {d.webhook?.url && !d.webhook.matches && (
            <div className="rounded-md bg-bg-3 px-3 py-2 font-mono text-xs">
              сейчас: {d.webhook.url}
              <br />
              нужно: {d.expectedWebhookUrl}
            </div>
          )}
          {d.webhook && (
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">Ждут доставки</dt>
              <dd className={cn("font-semibold tabular-nums", d.webhook.pending > 0 && "text-amber")}>
                {d.webhook.pending}
              </dd>
            </div>
          )}
          {d.webhook?.lastError && (
            <div className="rounded-md bg-bg-3 px-3 py-2 text-xs">
              <span className="font-semibold text-red">Последняя ошибка доставки:</span>{" "}
              <span className="font-mono">{d.webhook.lastError}</span>
              {d.webhook.lastErrorAt && (
                <>
                  {" · "}
                  <LocalDateTime
                    value={d.webhook.lastErrorAt}
                    options={{ day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }}
                  />
                </>
              )}
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Подключено пользователей</dt>
            <dd className="font-semibold tabular-nums">{d.linkedAccounts ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Уведомлений за 24 часа</dt>
            <dd className="font-semibold tabular-nums">{d.sent24h ?? "—"}</dd>
          </div>
        </dl>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
            Переменные окружения
          </p>
          <ul className="space-y-1.5 text-sm">
            {d.config.map((c) => (
              <li key={c.name} className="flex items-start gap-2">
                {c.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red" />
                )}
                <span>
                  <code className="text-xs">{c.name}</code>
                  {!c.ok && c.hint && <span className="block text-xs text-text-muted">{c.hint}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <TelegramDiagnosticsActions />

      <p className="text-xs text-text-muted">
        Проверено: <LocalDateTime value={d.checkedAt} options={{ hour: "2-digit", minute: "2-digit", second: "2-digit" }} />
      </p>
    </Card>
  );
}

export function TelegramDiagnosticsSkeleton() {
  return (
    <Card className="p-5">
      <p className="text-sm text-text-secondary">Проверяем связь с Telegram… (до 10 секунд)</p>
    </Card>
  );
}

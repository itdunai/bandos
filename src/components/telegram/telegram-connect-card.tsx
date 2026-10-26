"use client";

import {
  createTelegramLink,
  unlinkTelegram,
  updateTelegramSettings,
} from "@/app/actions/telegram";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { BellRing, ExternalLink, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export interface TelegramAccountView {
  username: string | null;
  first_name: string | null;
  notify_events: boolean;
  notify_todos: boolean;
  notify_bookings: boolean;
}

function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function TelegramConnectCard({
  bandSlug,
  account,
  showBookings,
}: {
  bandSlug: string;
  account: TelegramAccountView | null;
  showBookings: boolean;
}) {
  return (
    <Card className="h-full p-4">
      <div className="mb-3 flex items-center gap-2">
        <Send className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-bold uppercase tracking-wide">Уведомления в Telegram</h3>
      </div>
      {account ? (
        <LinkedState bandSlug={bandSlug} account={account} showBookings={showBookings} />
      ) : (
        <ConnectState />
      )}
    </Card>
  );
}

function ConnectState() {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<{ url: string; botUsername: string } | null>(null);

  return (
    <div className="space-y-3 text-sm">
      <p className="text-text-secondary">
        Бот напомнит о репетициях и концертах за сутки, о сроках по делам и пришлёт
        новые заявки на выступления.
      </p>
      {!link ? (
        <Button
          variant="accent"
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await createTelegramLink(browserTimeZone());
              if ("error" in res) showToast("error", res.error);
              else setLink(res);
            })
          }
        >
          <BellRing className="h-4 w-4" />
          Подключить Telegram
        </Button>
      ) : (
        <div className="space-y-3 rounded-lg border border-border bg-bg-3 p-3">
          <p>
            1. Откройте бота и нажмите <b>«Старт»</b>. Ссылка действует 15 минут.
          </p>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink hover:bg-accent-dark"
          >
            <ExternalLink className="h-4 w-4" />
            Открыть @{link.botUsername}
          </a>
          <p>2. Вернитесь сюда и проверьте подключение.</p>
          <Button onClick={() => router.refresh()}>Проверить</Button>
        </div>
      )}
    </div>
  );
}

function LinkedState({
  bandSlug,
  account,
  showBookings,
}: {
  bandSlug: string;
  account: TelegramAccountView;
  showBookings: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [prefs, setPrefs] = useState({
    notifyEvents: account.notify_events,
    notifyTodos: account.notify_todos,
    notifyBookings: account.notify_bookings,
  });

  function toggle(key: keyof typeof prefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    startTransition(async () => {
      const res = await updateTelegramSettings({ ...next, timezone: browserTimeZone() });
      if (!res.ok) {
        setPrefs(prefs);
        showToast("error", "Не удалось сохранить настройки");
      }
    });
  }

  const who = account.username ? `@${account.username}` : account.first_name ?? "ваш аккаунт";
  const options: { key: keyof typeof prefs; label: string; hint: string; show: boolean }[] = [
    { key: "notifyEvents", label: "Репетиции и концерты", hint: "за сутки до начала", show: true },
    { key: "notifyTodos", label: "Сроки по делам", hint: "утром в день срока", show: true },
    { key: "notifyBookings", label: "Заявки на выступления", hint: "сразу после отправки", show: showBookings },
  ];

  return (
    <div className="space-y-3 text-sm">
      <p className="text-text-secondary">
        Подключено: <span className="font-medium text-text-primary">{who}</span>
      </p>
      <ul className="space-y-1">
        {options
          .filter((o) => o.show)
          .map((o) => (
            <li key={o.key}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-bg-3">
                <input
                  type="checkbox"
                  checked={prefs[o.key]}
                  onChange={() => toggle(o.key)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <span className="flex-1">{o.label}</span>
                <span className="text-xs text-text-muted">{o.hint}</span>
              </label>
            </li>
          ))}
      </ul>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        className="text-text-muted hover:text-red"
        onClick={() => {
          if (!confirm("Отключить уведомления в Telegram?")) return;
          startTransition(async () => {
            await unlinkTelegram(bandSlug);
            router.refresh();
          });
        }}
      >
        Отключить
      </Button>
    </div>
  );
}

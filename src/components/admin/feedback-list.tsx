"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { updateFeedbackTicket } from "@/app/actions/platform-admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import {
  FEEDBACK_KIND_LABELS,
  FEEDBACK_STATUSES,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_STATUS_STYLES,
  type FeedbackStatus,
} from "@/lib/feedback/tickets";
import type { FeedbackRow } from "@/lib/platform/queries";
import { cn } from "@/lib/utils";

type Filter = "open" | "closed" | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "open", label: "Открытые" },
  { value: "closed", label: "Закрытые" },
  { value: "all", label: "Все" },
];

const isOpen = (s: FeedbackStatus) => s === "new" || s === "in_progress";

export function FeedbackList({ items }: { items: FeedbackRow[] }) {
  const [filter, setFilter] = useState<Filter>("open");
  const visible = items.filter((f) =>
    filter === "all" ? true : filter === "open" ? isOpen(f.status) : !isOpen(f.status)
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => {
          const count = items.filter((i) =>
            f.value === "all" ? true : f.value === "open" ? isOpen(i.status) : !isOpen(i.status)
          ).length;
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.value
                  ? "bg-accent text-accent-ink"
                  : "text-text-secondary hover:bg-bg-3 hover:text-text-primary"
              )}
            >
              {f.label} · {count}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <Card className="p-6 text-center text-sm text-text-secondary">
          {filter === "open" ? "Открытых обращений нет" : "Пусто"}
        </Card>
      ) : (
        visible.map((f) => <Ticket key={f.id} item={f} />)
      )}
    </div>
  );
}

function Ticket({ item }: { item: FeedbackRow }) {
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<FeedbackStatus>(item.status);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateFeedbackTicket(item.id, formData);
      if (!res.ok) {
        showToast("error", res.error ?? "Не удалось сохранить");
        return;
      }
      showToast("success", res.notified ? "Сохранено, автору ушло сообщение в Telegram" : "Сохранено");
    });
  }

  return (
    <Card className={cn("p-4", !isOpen(item.status) && "opacity-75")}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
        <span className={cn("rounded px-1.5 py-0.5 font-medium", FEEDBACK_STATUS_STYLES[item.status])}>
          {FEEDBACK_STATUS_LABELS[item.status]}
        </span>
        <span className="rounded bg-bg-3 px-1.5 py-0.5 font-medium text-text-primary">
          {FEEDBACK_KIND_LABELS[item.kind]}
        </span>
        <span>{item.email ?? "удалённый пользователь"}</span>
        {item.bands && (
          <Link href={`/${item.bands.slug}`} className="text-accent hover:underline">
            {item.bands.name}
          </Link>
        )}
        {item.page && <span className="truncate">{item.page}</span>}
        <span className="ml-auto">
          <LocalDateTime
            value={item.created_at}
            options={{ day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }}
          />
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm">{item.message}</p>

      <form action={onSubmit} className="mt-3 space-y-2 border-t border-border pt-3">
        <fieldset className="flex flex-wrap gap-1">
          <legend className="sr-only">Статус</legend>
          {FEEDBACK_STATUSES.map((s) => (
            <label key={s} className="cursor-pointer">
              <input
                type="radio"
                name="status"
                value={s}
                checked={status === s}
                onChange={() => setStatus(s)}
                className="peer sr-only"
              />
              <span className="inline-block rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-ink peer-focus-visible:ring-2 peer-focus-visible:ring-accent/25">
                {FEEDBACK_STATUS_LABELS[s]}
              </span>
            </label>
          ))}
        </fieldset>
        <Textarea
          name="admin_reply"
          rows={2}
          maxLength={4000}
          defaultValue={item.admin_reply ?? ""}
          aria-label="Ответ автору"
          placeholder="Ответ автору — увидит в разделе «Обратная связь»"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input type="checkbox" name="notify" defaultChecked className="accent-accent" />
            Написать автору в Telegram (если подключён)
          </label>
          <Button type="submit" size="sm" variant="accent" disabled={pending}>
            {pending ? "Сохраняем…" : "Сохранить"}
          </Button>
        </div>
        {item.replied_at && (
          <p className="text-[11px] text-text-muted">
            Ответ обновлён{" "}
            <LocalDateTime
              value={item.replied_at}
              options={{ day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }}
            />
          </p>
        )}
      </form>
    </Card>
  );
}

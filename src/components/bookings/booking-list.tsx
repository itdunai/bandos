"use client";

import { deleteBooking, updateBookingStatus } from "@/app/actions/bookings";
import { EmptyState } from "@/components/empty-state";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { bandPath } from "@/lib/paths";
import { cn, formatDate } from "@/lib/utils";
import {
  BOOKING_STATUS_LABELS,
  type BookingRequest,
  type BookingStatus,
} from "@/types/database";
import { CalendarPlus, Inbox, MapPin, PartyPopper, Trash2 } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";

const STATUS_ORDER: BookingStatus[] = ["new", "in_progress", "agreed", "declined"];

const STATUS_STYLE: Record<BookingStatus, string> = {
  new: "bg-accent text-accent-ink",
  in_progress: "bg-amber/15 text-amber",
  agreed: "bg-green/15 text-green",
  declined: "bg-bg-4 text-text-muted",
};

/** Ссылка на контакт: телефон, e-mail или Telegram — иначе просто текст. */
function contactHref(contact: string): string | null {
  const c = contact.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return `mailto:${c}`;
  if (/^@[A-Za-z0-9_]{4,32}$/.test(c)) return `https://t.me/${c.slice(1)}`;
  const digits = c.replace(/[^\d+]/g, "");
  if (/^\+?\d{7,15}$/.test(digits)) return `tel:${digits}`;
  return null;
}

function newEventHref(bandSlug: string, b: BookingRequest) {
  const params = new URLSearchParams({ type: "performance" });
  if (b.event_date) params.set("date", b.event_date);
  params.set("title", [b.event_format, b.name].filter(Boolean).join(" · ").slice(0, 120));
  if (b.city) params.set("location", b.city);
  return `${bandPath(bandSlug, "schedule", "new")}?${params.toString()}`;
}

export function BookingList({
  bookings,
  bandId,
  bandSlug,
}: {
  bookings: BookingRequest[];
  bandId: string;
  bandSlug: string;
}) {
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [, startTransition] = useTransition();
  const [items, applyOptimistic] = useOptimistic(
    bookings,
    (state, action: { id: string; status?: BookingStatus; remove?: boolean }) =>
      action.remove
        ? state.filter((b) => b.id !== action.id)
        : state.map((b) => (b.id === action.id ? { ...b, status: action.status! } : b))
  );

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-8 w-8" />}
        title="Заявок пока нет"
        description="Когда заказчик заполнит форму «Заказать выступление» на публичной странице, заявка появится здесь."
      />
    );
  }

  const counts = STATUS_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: items.filter((b) => b.status === s).length }),
    {} as Record<BookingStatus, number>
  );
  const visible = filter === "all" ? items : items.filter((b) => b.status === filter);

  function setStatus(b: BookingRequest, status: BookingStatus) {
    startTransition(async () => {
      applyOptimistic({ id: b.id, status });
      await updateBookingStatus(b.id, bandId, bandSlug, status);
    });
  }

  function remove(b: BookingRequest) {
    if (!confirm(`Удалить заявку от «${b.name}»?`)) return;
    startTransition(async () => {
      applyOptimistic({ id: b.id, remove: true });
      await deleteBooking(b.id, bandId, bandSlug);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", ...STATUS_ORDER] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              filter === s
                ? "border-text-primary bg-text-primary text-bg"
                : "border-border text-text-secondary hover:text-text-primary"
            )}
          >
            {s === "all" ? "Все" : BOOKING_STATUS_LABELS[s]}{" "}
            <span className="opacity-60">{s === "all" ? items.length : counts[s]}</span>
          </button>
        ))}
      </div>

      <ul className="grid gap-3 lg:grid-cols-2">
        {visible.map((b) => {
          const href = contactHref(b.contact);
          return (
            <li key={b.id} className="flex flex-col gap-3 rounded-xl border border-border bg-bg-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{b.name}</div>
                  {href ? (
                    <a
                      href={href}
                      target={href.startsWith("https:") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="break-all text-sm text-accent hover:underline"
                    >
                      {b.contact}
                    </a>
                  ) : (
                    <div className="break-all text-sm text-text-secondary">{b.contact}</div>
                  )}
                </div>
                <select
                  value={b.status}
                  onChange={(e) => setStatus(b, e.target.value as BookingStatus)}
                  aria-label="Статус заявки"
                  className={cn(
                    "shrink-0 cursor-pointer rounded-sm border-0 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider outline-none",
                    STATUS_STYLE[b.status]
                  )}
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {BOOKING_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
                {b.event_date && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarPlus className="h-4 w-4" />
                    {formatDate(b.event_date, { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
                {b.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {b.city}
                  </span>
                )}
                {b.event_format && (
                  <span className="inline-flex items-center gap-1.5">
                    <PartyPopper className="h-4 w-4" />
                    {b.event_format}
                  </span>
                )}
              </div>

              {b.message && (
                <p className="whitespace-pre-wrap rounded-lg bg-bg-3 px-3 py-2 text-sm">{b.message}</p>
              )}

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-xs text-text-muted">
                  <LocalDateTime
                    value={b.created_at}
                    options={{ day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }}
                  />
                </span>
                <div className="flex items-center gap-1">
                  <Link
                    href={newEventHref(bandSlug, b)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent/10"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" />
                    В график
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(b)}
                    className="rounded-lg p-1.5 text-text-muted hover:bg-bg-3 hover:text-red"
                    aria-label="Удалить заявку"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

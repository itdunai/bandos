"use client";

import { bandPath } from "@/lib/paths";
import { cn, formatDate } from "@/lib/utils";
import { EVENT_TYPE_LABELS, type Event } from "@/types/database";
import { Calendar, Mic2, Star } from "lucide-react";
import Link from "next/link";
import { useIsClient } from "@/lib/use-is-client";

const REMINDER_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

type Urgency = "today" | "soon" | "week";

function EventIcon({
  type,
  className,
}: {
  type: Event["event_type"];
  className?: string;
}) {
  if (type === "rehearsal") return <Mic2 className={className} />;
  if (type === "performance") return <Star className={className} />;
  return <Calendar className={className} />;
}

function daysUntil(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return Math.round((day.getTime() - today.getTime()) / DAY_MS);
}

function dayLabel(date: Date, days: number) {
  if (days === 0) return "Сегодня";
  if (days === 1) return "Завтра";
  if (days < 7) {
    const wd = formatDate(date, { weekday: "short", day: undefined, month: undefined });
    return wd.charAt(0).toUpperCase() + wd.slice(1);
  }
  return formatDate(date);
}

function timeLabel(date: Date) {
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

const URGENCY_STYLES: Record<Urgency, { chip: string; dot: string }> = {
  today: { chip: "border-amber/40 bg-amber/10 text-amber", dot: "bg-amber" },
  soon: { chip: "border-accent/30 bg-accent/10 text-accent", dot: "bg-accent" },
  week: { chip: "border-border bg-bg-3 text-text-secondary", dot: "bg-text-muted" },
};

/**
 * Компактное напоминание о ближайшем событии (в пределах недели).
 * `header` — пилюля в мобильной шапке, `sidebar` — строка в боковом меню.
 * Рендерится только в браузере: дата и время — в часовом поясе пользователя.
 */
export function UpcomingEventChip({
  event,
  bandSlug,
  variant,
}: {
  event: Event | null;
  bandSlug: string;
  variant: "header" | "sidebar";
}) {
  const isClient = useIsClient();

  if (!isClient || !event) return null;

  const date = new Date(event.starts_at);
  const days = daysUntil(date);
  if (days < 0 || days > REMINDER_DAYS) return null;

  const urgency: Urgency = days === 0 ? "today" : days <= 3 ? "soon" : "week";
  const styles = URGENCY_STYLES[urgency];
  const when = `${dayLabel(date, days)} ${timeLabel(date)}`;
  const fullLabel = [
    EVENT_TYPE_LABELS[event.event_type],
    event.title,
    `${formatDate(date, { weekday: "short", day: "numeric", month: "long" })}, ${timeLabel(date)}`,
    event.location,
  ]
    .filter(Boolean)
    .join(" · ");
  const href = bandPath(bandSlug, "schedule", event.id, "edit");

  const pulse = urgency === "today" && (
    <span className="relative flex h-2 w-2 shrink-0">
      <span
        className={cn(
          "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
          styles.dot
        )}
      />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", styles.dot)} />
    </span>
  );

  if (variant === "header") {
    return (
      <Link
        href={href}
        title={fullLabel}
        aria-label={`Ближайшее событие: ${fullLabel}`}
        className={cn(
          "flex h-8 max-w-[9.5rem] shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium tabular-nums transition-colors",
          styles.chip
        )}
      >
        {pulse || <EventIcon type={event.event_type} className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{when}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      title={fullLabel}
      className={cn(
        "mt-3 flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors hover:border-accent/50",
        styles.chip
      )}
    >
      <EventIcon type={event.event_type} className="h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[11px] font-medium tabular-nums">
          {pulse}
          {when}
        </div>
        <div className="truncate text-[11px] text-text-secondary">{event.title}</div>
      </div>
    </Link>
  );
}

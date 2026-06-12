import { bandPath } from "@/lib/paths";
import { cn, formatDate } from "@/lib/utils";
import type { Event } from "@/types/database";
import { Calendar, Mic2, Star } from "lucide-react";
import Link from "next/link";

const REMINDER_DAYS = 7;

export function UpcomingEventBanner({
  event,
  bandSlug,
}: {
  event: Event;
  bandSlug: string;
}) {
  const date = new Date(event.starts_at);
  const isRehearsal = event.event_type === "rehearsal";
  const Icon = isRehearsal ? Mic2 : Star;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(date);
  eventDay.setHours(0, 0, 0, 0);
  const daysUntil = Math.ceil(
    (eventDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (daysUntil > REMINDER_DAYS) return null;

  const urgency =
    daysUntil <= 1 ? "urgent" : daysUntil <= 3 ? "soon" : "normal";

  return (
    <Link
      href={bandPath(bandSlug, "schedule", event.id, "edit")}
      className={cn(
        "mb-4 flex items-center gap-3 rounded-xl border p-4 transition-colors hover:border-accent/50",
        isRehearsal ? "border-border bg-bg-2" : "border-amber/30 bg-amber/5",
        urgency === "urgent" && "ring-1 ring-amber/40",
        urgency === "soon" && "ring-1 ring-accent/30"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          isRehearsal ? "bg-bg-3 text-accent" : "bg-amber/15 text-amber"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-text-muted">
          <Calendar className="h-3 w-3" />
          {daysUntil === 0
            ? "Сегодня"
            : daysUntil === 1
              ? "Завтра"
              : `Через ${daysUntil} дн.`}
        </div>
        <div className="truncate font-medium">{event.title}</div>
        <div className="text-xs text-text-secondary">
          {formatDate(date, {
            weekday: "short",
            day: "numeric",
            month: "long",
          })}
          {" · "}
          {date.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {event.location && ` · ${event.location}`}
        </div>
      </div>
      <span
        className={cn(
          "hidden shrink-0 rounded-md px-2 py-1 text-[10px] uppercase sm:inline",
          isRehearsal ? "bg-accent/15 text-accent" : "bg-amber/15 text-amber"
        )}
      >
        {isRehearsal ? "Репетиция" : "Концерт"}
      </span>
    </Link>
  );
}

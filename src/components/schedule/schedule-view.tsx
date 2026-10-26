"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bandPath } from "@/lib/paths";
import { cn, formatDate } from "@/lib/utils";
import type { EventType } from "@/types/database";
import { EVENT_TYPE_LABELS } from "@/types/database";
import { RecordEventFeeButton } from "@/components/finances/record-event-fee-button";
import { RecordEventRentButton } from "@/components/finances/record-event-rent-button";
import { formatMoney } from "@/lib/finance";
import { Calendar, ChevronLeft, ChevronRight, Mic2, Plus, Star } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { PageLoader } from "@/components/ui/page-loader";
import { useIsClient } from "@/lib/use-is-client";

export interface ScheduleEvent {
  id: string;
  event_type: EventType;
  title: string;
  starts_at: string;
  location: string | null;
  notes: string | null;
  fee?: number | null;
  rent?: number | null;
  finance_recorded?: boolean;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getCalendarCells(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1);
  let startOffset = first.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];

  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function isSameDay(a: Date, year: number, month: number, day: number) {
  return (
    a.getFullYear() === year && a.getMonth() === month && a.getDate() === day
  );
}

function isFutureDay(
  today: Date,
  year: number,
  month: number,
  day: number
) {
  const cell = new Date(year, month, day);
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  return cell.getTime() > todayStart.getTime();
}

function formatDateParam(year: number, month: number, day: number) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MAX_DAY_CHIPS = 3;

const DOT_CLASS: Record<EventType, string> = {
  rehearsal: "bg-accent",
  performance: "bg-amber",
  other: "bg-text-muted",
};

const CHIP_CLASS: Record<EventType, string> = {
  rehearsal: "border-accent bg-accent/12 text-text-primary hover:bg-accent/20",
  performance: "border-amber bg-amber/12 text-text-primary hover:bg-amber/20",
  other: "border-text-muted bg-bg-3 text-text-primary hover:bg-bg-4",
};

function getEventMeta(eventType: EventType) {
  if (eventType === "rehearsal") {
    return {
      Icon: Mic2,
      shortLabel: "Реп.",
      badgeVariant: "purple" as const,
      isRehearsal: true,
      isPerformance: false,
    };
  }
  if (eventType === "performance") {
    return {
      Icon: Star,
      shortLabel: "Концерт",
      badgeVariant: "amber" as const,
      isRehearsal: false,
      isPerformance: true,
    };
  }
  return {
    Icon: Calendar,
    shortLabel: "Другое",
    badgeVariant: "muted" as const,
    isRehearsal: false,
    isPerformance: false,
  };
}

function eventMoney(event: ScheduleEvent) {
  if (event.event_type === "performance") return event.fee;
  if (event.event_type === "rehearsal") return event.rent;
  return null;
}

type ScheduleViewProps = {
  events: ScheduleEvent[];
  bandSlug: string;
  bandId: string;
  isAdmin?: boolean;
};

/**
 * Календарь целиком зависит от часового пояса пользователя («сегодня», день
 * события), а сервер работает в UTC — поэтому рендерим только в браузере.
 */
export function ScheduleView(props: ScheduleViewProps) {
  const isClient = useIsClient();
  if (!isClient) return <PageLoader label="Загрузка графика…" />;
  return <ScheduleCalendar {...props} />;
}

function ScheduleCalendar({
  events,
  bandSlug,
  bandId,
  isAdmin = false,
}: ScheduleViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const eventsListRef = useRef<HTMLElement>(null);

  const todayLabel = capitalize(
    new Intl.DateTimeFormat("ru-RU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(today)
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<number, ScheduleEvent[]>();
    for (const event of events) {
      const d = new Date(event.starts_at);
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      const day = d.getDate();
      const list = map.get(day) ?? [];
      list.push(event);
      map.set(day, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      );
    }
    return map;
  }, [events, year, month]);

  const monthEvents = useMemo(() => {
    const list = events.filter((e) => {
      const d = new Date(e.starts_at);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    list.sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    );
    return list;
  }, [events, year, month]);

  const visibleEvents = useMemo(() => {
    if (selectedDay === null) return monthEvents;
    return monthEvents.filter((e) => new Date(e.starts_at).getDate() === selectedDay);
  }, [monthEvents, selectedDay]);

  const calendarCells = getCalendarCells(year, month);
  const now = today.getTime();

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    setSelectedDay(null);
  }

  function selectDay(day: number) {
    setSelectedDay((prev) => (prev === day ? null : day));
    window.setTimeout(() => {
      eventsListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Сегодня:{" "}
        <span className="font-medium text-text-primary">{todayLabel}</span>
      </p>

      <div className="mx-auto flex w-full max-w-[1000px] items-center justify-center gap-2 sm:gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => shiftMonth(-1)}
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <p
          className="min-w-[10rem] text-center text-base font-medium text-text-primary sm:min-w-[12rem] sm:text-lg"
          aria-live="polite"
        >
          {MONTHS[month]} {year}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => shiftMonth(1)}
          aria-label="Следующий месяц"
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      <div className="mx-auto w-full max-w-[1100px]">
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-7 border-b border-border bg-bg-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
              >
                {day}
              </div>
            ))}
          </div>
          {/* gap-px на фоне border рисует тонкие линии сетки */}
          <div className="grid grid-cols-7 gap-px bg-border">
            {calendarCells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="min-h-[52px] bg-bg md:min-h-[104px]" />;
              }

              const dayEvents = eventsByDay.get(day) ?? [];
              const isToday = isSameDay(today, year, month, day);
              const isSelected = selectedDay === day;
              const isFuture = isFutureDay(today, year, month, day);
              const isPast = !isToday && !isFuture;

              const dayNumber = (
                <span
                  className={cn(
                    "inline-flex h-6 min-w-6 items-center justify-center rounded-sm px-1 text-sm font-semibold tabular-nums",
                    isToday
                      ? "bg-accent text-accent-ink"
                      : isSelected
                        ? "text-accent"
                        : isPast
                          ? "text-text-muted"
                          : "text-text-primary"
                  )}
                >
                  {day}
                </span>
              );

              return (
                <div
                  key={day}
                  className={cn(
                    "group relative min-h-[52px] md:min-h-[104px]",
                    isPast ? "bg-bg" : "bg-bg-2",
                    isSelected && "ring-2 ring-inset ring-accent"
                  )}
                >
                  {/* Мобилка: номер дня и точки событий */}
                  <button
                    type="button"
                    onClick={() => dayEvents.length > 0 && selectDay(day)}
                    className="flex h-full w-full flex-col items-center justify-center gap-1 p-1 md:hidden"
                    aria-label={`${day}, событий: ${dayEvents.length}`}
                  >
                    {dayNumber}
                    <span className="flex h-1.5 gap-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span key={e.id} className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASS[e.event_type])} />
                      ))}
                    </span>
                  </button>

                  {/* Десктоп: номер дня и плашки событий */}
                  <div className="hidden h-full flex-col gap-1 p-1.5 md:flex">
                    <div className="flex items-center justify-between">
                      {dayNumber}
                      {isFuture && (
                        <Link
                          href={`${bandPath(bandSlug, "schedule", "new")}?date=${encodeURIComponent(formatDateParam(year, month, day))}`}
                          className="flex h-6 w-6 items-center justify-center rounded-sm text-text-muted opacity-0 transition-opacity hover:bg-accent hover:text-accent-ink focus-visible:opacity-100 group-hover:opacity-100"
                          aria-label={`Новое событие ${day} ${MONTHS[month].toLowerCase()}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                    {dayEvents.slice(0, MAX_DAY_CHIPS).map((event) => (
                      <CalendarEventTile
                        key={event.id}
                        event={event}
                        bandSlug={bandSlug}
                        past={new Date(event.starts_at).getTime() < now}
                      />
                    ))}
                    {dayEvents.length > MAX_DAY_CHIPS && (
                      <button
                        type="button"
                        onClick={() => selectDay(day)}
                        className="text-left text-xs text-text-muted hover:text-accent"
                      >
                        ещё {dayEvents.length - MAX_DAY_CHIPS}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-text-muted md:hidden">
          Нажмите на день с точками — события появятся в списке ниже
        </p>
      </div>

      <section ref={eventsListRef}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            <Calendar className="h-3.5 w-3.5" />
            {selectedDay !== null
              ? `${selectedDay} ${MONTHS[month].toLowerCase()} ${year}`
              : `События — ${MONTHS[month]} ${year}`}
          </h2>
          {selectedDay !== null && (
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-xs text-accent hover:underline"
            >
              Все дни месяца
            </button>
          )}
        </div>

        {visibleEvents.length === 0 ? (
          <p className="rounded-xl border border-border bg-bg-2 px-4 py-8 text-center text-sm text-text-secondary">
            {monthEvents.length === 0
              ? "В этом месяце событий нет"
              : selectedDay !== null
                ? "В этот день событий нет"
                : "Нет событий"}
          </p>
        ) : (
          <div className="space-y-2">
            {visibleEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                bandSlug={bandSlug}
                bandId={bandId}
                isAdmin={isAdmin}
                past={new Date(event.starts_at).getTime() < now}
                showDate={selectedDay === null}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CalendarEventTile({
  event,
  bandSlug,
  past,
}: {
  event: ScheduleEvent;
  bandSlug: string;
  past: boolean;
}) {
  return (
    <Link
      href={bandPath(bandSlug, "schedule", event.id, "edit")}
      title={[event.title, event.location].filter(Boolean).join(" · ")}
      className={cn(
        "block truncate rounded-sm border-l-2 px-1.5 py-1 text-xs leading-tight transition-colors",
        CHIP_CLASS[event.event_type],
        past && "opacity-60"
      )}
    >
      <span className="font-semibold tabular-nums">{formatTime(event.starts_at)}</span>{" "}
      {event.title}
    </Link>
  );
}

function EventCard({
  event,
  bandSlug,
  bandId,
  isAdmin,
  past,
  showDate = true,
}: {
  event: ScheduleEvent;
  bandSlug: string;
  bandId: string;
  isAdmin: boolean;
  past?: boolean;
  showDate?: boolean;
}) {
  const date = new Date(event.starts_at);
  const meta = getEventMeta(event.event_type);
  const { Icon, badgeVariant, isRehearsal, isPerformance } = meta;
  const money = eventMoney(event);
  const showFeeAction =
    isAdmin &&
    isPerformance &&
    event.fee &&
    event.fee > 0 &&
    !event.finance_recorded;
  const showRentAction =
    isAdmin &&
    isRehearsal &&
    event.rent &&
    event.rent > 0 &&
    !event.finance_recorded;

  return (
    <div
      className={cn(
        "rounded-xl border bg-bg-2 p-3.5",
        past ? "border-border opacity-70" : "border-border",
        isPerformance && !past && "border-amber/30"
      )}
    >
    <Link
      href={bandPath(bandSlug, "schedule", event.id, "edit")}
      className="flex gap-3.5 transition-colors hover:opacity-90"
    >
      {showDate && (
        <div
          className={cn(
            "min-w-[52px] shrink-0 rounded-lg px-3 py-2 text-center",
            isPerformance ? "bg-amber/10" : "bg-bg-3"
          )}
        >
          <div
            className={cn(
              "text-xl font-medium leading-none",
              isPerformance && "text-amber"
            )}
          >
            {date.getDate()}
          </div>
          <div className="mt-0.5 text-[11px] uppercase text-text-muted">
            {formatDate(date, { month: "short" })}
          </div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 font-medium">
          <Icon
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              isRehearsal ? "text-accent" : isPerformance ? "text-amber" : "text-text-muted"
            )}
          />
          <span className="truncate">{event.title}</span>
        </div>
        <div className="mt-0.5 text-xs text-text-secondary">
          {!showDate && (
            <span>
              {date.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
              })}
              {" · "}
            </span>
          )}
          {event.location && <span>{event.location} · </span>}
          {formatTime(event.starts_at)}
          {money ? ` · ${formatMoney(money)}` : ""}
        </div>
        {event.notes && (
          <p className="mt-2 line-clamp-2 text-xs text-text-secondary">
            {event.notes}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant={badgeVariant}>
            {EVENT_TYPE_LABELS[event.event_type]}
          </Badge>
          {event.finance_recorded && (
            <Badge variant="blue">В финансах</Badge>
          )}
        </div>
      </div>
    </Link>
    {showFeeAction && (
      <div className="mt-3 border-t border-border pt-3">
        <RecordEventFeeButton
          eventId={event.id}
          bandId={bandId}
          bandSlug={bandSlug}
        />
      </div>
    )}
    {showRentAction && (
      <div className="mt-3 border-t border-border pt-3">
        <RecordEventRentButton
          eventId={event.id}
          bandId={bandId}
          bandSlug={bandSlug}
        />
      </div>
    )}
    </div>
  );
}

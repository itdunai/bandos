"use client";

import { Badge } from "@/components/ui/badge";
import { bandPath } from "@/lib/paths";
import { cn, formatDate } from "@/lib/utils";
import type { EventType } from "@/types/database";
import { RecordEventFeeButton } from "@/components/finances/record-event-fee-button";
import { formatMoney } from "@/lib/finance";
import { Calendar, Mic2, Star } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

export interface ScheduleEvent {
  id: string;
  event_type: EventType;
  title: string;
  starts_at: string;
  location: string | null;
  notes: string | null;
  fee?: number | null;
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

const selectClass =
  "rounded-lg border border-border bg-bg-3 px-3 py-2 text-sm outline-none focus:border-accent";

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

export function ScheduleView({
  events,
  bandSlug,
  bandId,
  isAdmin = false,
}: {
  events: ScheduleEvent[];
  bandSlug: string;
  bandId: string;
  isAdmin?: boolean;
}) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [year, setYear] = useState(currentYear);
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

  const years = useMemo(() => {
    const set = new Set<number>([currentYear]);
    for (const e of events) {
      set.add(new Date(e.starts_at).getFullYear());
    }
    const min = Math.min(...set);
    const max = Math.max(...set);
    const list: number[] = [];
    for (let y = min - 1; y <= max + 1; y++) list.push(y);
    return list;
  }, [events, currentYear]);

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

  function handleMonthChange(nextMonth: number) {
    setMonth(nextMonth);
    setSelectedDay(null);
  }

  function handleYearChange(nextYear: number) {
    setYear(nextYear);
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

      <div className="mx-auto flex w-full max-w-[1000px] flex-wrap items-center justify-center gap-3">
        <select
          value={year}
          onChange={(e) => handleYearChange(Number(e.target.value))}
          className={selectClass}
          aria-label="Год"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => handleMonthChange(Number(e.target.value))}
          className={selectClass}
          aria-label="Месяц"
        >
          {MONTHS.map((name, i) => (
            <option key={name} value={i}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="mx-auto w-full max-w-[1000px]">
        <div className="overflow-hidden rounded-xl border border-border bg-bg-2 p-2 sm:p-3">
          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-[10px] font-medium uppercase tracking-wider text-text-muted sm:text-xs"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, i) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[44px] md:min-h-[72px]"
                  />
                );
              }

              const dayEvents = eventsByDay.get(day) ?? [];
              const hasEvents = dayEvents.length > 0;
              const isToday = isSameDay(today, year, month, day);
              const isSelected = selectedDay === day;
              const hasPerformance = dayEvents.some(
                (e) => e.event_type === "performance"
              );
              const hasRehearsal = dayEvents.some(
                (e) => e.event_type === "rehearsal"
              );

              if (!hasEvents) {
                const isFuture = isFutureDay(today, year, month, day);

                if (isFuture) {
                  return (
                    <EmptyFutureDayCell
                      key={day}
                      day={day}
                      bandSlug={bandSlug}
                      dateParam={formatDateParam(year, month, day)}
                    />
                  );
                }

                return (
                  <div
                    key={day}
                    className={cn(
                      "flex min-h-[44px] items-center justify-center rounded-lg md:min-h-[72px]",
                      isToday && "ring-1 ring-accent/30"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm",
                        isToday
                          ? "font-medium text-accent"
                          : "text-text-muted/40"
                      )}
                    >
                      {day}
                    </span>
                  </div>
                );
              }

              return (
                <div key={day} className="min-h-[44px] md:min-h-[72px]">
                  {/* Мобилка: компактная ячейка с точками */}
                  <button
                    type="button"
                    onClick={() => selectDay(day)}
                    className={cn(
                      "flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg border p-1 transition-colors md:hidden",
                      isSelected
                        ? "border-accent bg-accent/15"
                        : "border-border bg-bg-3",
                      isToday && !isSelected && "ring-1 ring-accent/50"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-medium leading-none",
                        isToday || isSelected ? "text-accent" : "text-text-primary"
                      )}
                    >
                      {day}
                    </span>
                    <span className="flex gap-0.5">
                      {hasRehearsal && (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      )}
                      {hasPerformance && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber" />
                      )}
                    </span>
                  </button>

                  {/* Десктоп: плитки с деталями */}
                  <div
                    className={cn(
                      "hidden h-full flex-col gap-1 rounded-lg border border-border bg-bg-3 p-1.5 md:flex",
                      isToday && "ring-1 ring-accent/50"
                    )}
                  >
                    <span
                      className={cn(
                        "block w-full text-center text-xs font-medium leading-none",
                        isToday ? "text-accent" : "text-text-muted"
                      )}
                    >
                      {day}
                    </span>
                    <div className="flex flex-1 flex-col gap-1">
                      {dayEvents.map((event) => (
                        <CalendarEventTile
                          key={event.id}
                          event={event}
                          bandSlug={bandSlug}
                          bandId={bandId}
                          isAdmin={isAdmin}
                          past={new Date(event.starts_at).getTime() < now}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] text-text-muted md:hidden">
          Нажмите на день с точками — события появятся в списке ниже
        </p>
      </div>

      <section ref={eventsListRef}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted">
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

function EmptyFutureDayCell({
  day,
  bandSlug,
  dateParam,
}: {
  day: number;
  bandSlug: string;
  dateParam: string;
}) {
  const href =
    bandPath(bandSlug, "schedule", "new") +
    `?date=${encodeURIComponent(dateParam)}`;

  return (
    <Link
      href={href}
      className="group relative flex min-h-[44px] items-center justify-center rounded-lg transition-colors hover:bg-bg-3 md:min-h-[72px]"
    >
      <span className="text-sm text-text-muted/40 transition-opacity group-hover:opacity-0">
        {day}
      </span>
      <span className="absolute inset-0 hidden items-center justify-center px-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 md:flex">
        <span className="rounded-md bg-accent px-2 py-1 text-center text-[10px] font-medium leading-tight text-white">
          Новое событие
        </span>
      </span>
    </Link>
  );
}

function CalendarEventTile({
  event,
  bandSlug,
  bandId,
  isAdmin,
  past,
}: {
  event: ScheduleEvent;
  bandSlug: string;
  bandId: string;
  isAdmin: boolean;
  past: boolean;
}) {
  const isRehearsal = event.event_type === "rehearsal";
  const Icon = isRehearsal ? Mic2 : Star;
  const showFeeAction =
    isAdmin &&
    !isRehearsal &&
    event.fee &&
    event.fee > 0 &&
    !event.finance_recorded;

  return (
    <div
      className={cn(
        "rounded-md border px-2 py-1.5",
        past ? "border-border/60 opacity-70" : "border-border",
        !isRehearsal && !past && "border-amber/30 bg-amber/5",
        isRehearsal && !past && "bg-bg-2"
      )}
    >
      <Link
        href={bandPath(bandSlug, "schedule", event.id, "edit")}
        className="block transition-colors hover:text-accent"
      >
        <div className="flex items-center gap-1">
          <Icon
            className={cn(
              "h-3 w-3 shrink-0",
              isRehearsal ? "text-accent" : "text-amber"
            )}
          />
          <span className="truncate text-[11px] font-medium leading-tight">
            {event.title}
          </span>
        </div>
        <div className="mt-0.5 truncate text-[10px] text-text-secondary">
          {formatTime(event.starts_at)}
          {event.location && ` · ${event.location}`}
          {event.fee ? ` · ${formatMoney(event.fee)}` : ""}
        </div>
        <span
          className={cn(
            "mt-0.5 inline-block rounded px-1 py-px text-[8px] uppercase tracking-wide",
            isRehearsal
              ? "bg-accent/15 text-accent"
              : "bg-amber/15 text-amber"
          )}
        >
          {isRehearsal ? "Реп." : "Концерт"}
        </span>
      </Link>
      {showFeeAction && (
        <div className="mt-1">
          <RecordEventFeeButton
            eventId={event.id}
            bandId={bandId}
            bandSlug={bandSlug}
            compact
          />
        </div>
      )}
    </div>
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
  const isRehearsal = event.event_type === "rehearsal";
  const Icon = isRehearsal ? Mic2 : Star;
  const showFeeAction =
    isAdmin &&
    !isRehearsal &&
    event.fee &&
    event.fee > 0 &&
    !event.finance_recorded;

  return (
    <div
      className={cn(
        "rounded-xl border bg-bg-2 p-3.5",
        past ? "border-border opacity-70" : "border-border",
        !isRehearsal && !past && "border-amber/30"
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
            !isRehearsal ? "bg-amber/10" : "bg-bg-3"
          )}
        >
          <div
            className={cn(
              "text-xl font-medium leading-none",
              !isRehearsal && "text-amber"
            )}
          >
            {date.getDate()}
          </div>
          <div className="mt-0.5 text-[10px] uppercase text-text-muted">
            {formatDate(date, { month: "short" })}
          </div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 font-medium">
          <Icon
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              isRehearsal ? "text-accent" : "text-amber"
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
          {event.fee ? ` · ${formatMoney(event.fee)}` : ""}
        </div>
        {event.notes && (
          <p className="mt-2 line-clamp-2 text-xs text-text-secondary">
            {event.notes}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant={isRehearsal ? "purple" : "amber"}>
            {isRehearsal ? "Репетиция" : "Выступление"}
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
    </div>
  );
}

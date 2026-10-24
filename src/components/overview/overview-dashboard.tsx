"use client";

import { toggleTodo } from "@/app/actions/todos";
import type {
  BandOverview,
  OverviewEvent,
  OverviewSetlist,
  OverviewTodo,
} from "@/lib/band/overview";
import { parseDateValue } from "@/lib/datetime";
import { formatMoney } from "@/lib/finance";
import { bandPath } from "@/lib/paths";
import { useIsClient } from "@/lib/use-is-client";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import { EVENT_TYPE_LABELS, type EventType } from "@/types/database";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  Clock,
  MapPin,
  Music,
  Play,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysBetween(from: Date, to: Date) {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function relativeDays(days: number) {
  if (days === 0) return "сегодня";
  if (days === 1) return "завтра";
  const mod10 = days % 10;
  const mod100 = days % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? "день"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "дня"
        : "дней";
  return `через ${days} ${word}`;
}

const DOT_CLASS: Record<EventType, string> = {
  rehearsal: "bg-blue",
  performance: "bg-accent",
  other: "bg-text-muted",
};

export function OverviewGreeting({ name }: { name: string | null }) {
  const isClient = useIsClient();
  if (!isClient) return <span>&nbsp;</span>;
  const now = new Date();
  const h = now.getHours();
  const hello =
    h < 5 ? "Доброй ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер";
  const date = formatDate(now, { weekday: "long", day: "numeric", month: "long" });
  return (
    <span>
      {hello}
      {name ? `, ${name}` : ""} · {date}
    </span>
  );
}

export function OverviewDashboard({
  bandSlug,
  data,
  canEditSchedule,
  canEditTodos,
}: {
  bandSlug: string;
  data: BandOverview;
  canEditSchedule: boolean;
  canEditTodos: boolean;
}) {
  const isClient = useIsClient();

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        {isClient ? (
          <NextEventHero
            events={data.events}
            bandSlug={bandSlug}
            canEditSchedule={canEditSchedule}
            showFee={!!data.finance}
          />
        ) : (
          <div className="h-[200px] rounded-xl border border-border bg-bg-2" />
        )}
        {data.setlist && <SetlistCard setlist={data.setlist} bandSlug={bandSlug} />}
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <Section title="Эта неделя" href={bandPath(bandSlug, "schedule")} linkLabel="График">
          {isClient ? (
            <WeekStrip events={data.events} bandSlug={bandSlug} />
          ) : (
            <div className="h-[76px]" />
          )}
        </Section>

        <Section
          title="Дела"
          href={bandPath(bandSlug, "todos")}
          linkLabel={data.openTodosCount > 0 ? `Все ${data.openTodosCount}` : "Открыть"}
        >
          <TodoPreview
            todos={data.todos}
            bandSlug={bandSlug}
            canToggle={canEditTodos}
          />
        </Section>

        {data.finance ? (
          <Section title="Касса группы" href={bandPath(bandSlug, "finances")} linkLabel="Финансы">
            <FinancePreview finance={data.finance} />
          </Section>
        ) : null}

        <Section title="Репертуар" href={bandPath(bandSlug, "songs")} linkLabel="Треки">
          <RepertoirePreview {...data.repertoire} />
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-bg-2">
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-4 sm:px-5">
        <h2 className="text-xs font-bold uppercase tracking-wide">{title}</h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-accent"
        >
          {linkLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="px-2 pb-3 sm:px-3">{children}</div>
    </section>
  );
}

/* ---------------------------- Ближайшее событие ---------------------------- */

function NextEventHero({
  events,
  bandSlug,
  canEditSchedule,
  showFee,
}: {
  events: OverviewEvent[];
  bandSlug: string;
  canEditSchedule: boolean;
  showFee: boolean;
}) {
  const now = new Date();
  const event = events.find((e) => new Date(e.ends_at ?? e.starts_at) >= now);

  if (!event) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border-strong bg-bg-2 p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          Ближайшее событие
        </div>
        <p className="heading-poster text-xl">В графике пока пусто</p>
        <p className="text-sm text-text-secondary">
          Запланируйте репетицию или концерт — здесь появится обратный отсчёт и сет-лист.
        </p>
        {canEditSchedule && (
          <Link
            href={bandPath(bandSlug, "schedule", "new")}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink hover:bg-accent-dark"
          >
            <CalendarPlus className="h-4 w-4" />
            Запланировать
          </Link>
        )}
      </div>
    );
  }

  const start = new Date(event.starts_at);
  const days = daysBetween(now, start);
  const ongoing = start <= now;
  const msLeft = start.getTime() - now.getTime();
  const countdown = ongoing
    ? "идёт"
    : msLeft < DAY_MS
      ? `${Math.floor(msLeft / 3_600_000)}ч ${String(Math.floor((msLeft % 3_600_000) / 60_000)).padStart(2, "0")}м`
      : `${Math.floor(msLeft / DAY_MS)}д ${String(Math.floor((msLeft % DAY_MS) / 3_600_000)).padStart(2, "0")}ч`;
  const month = formatDate(start, { month: "short", day: undefined }).replace(".", "");
  const weekday = formatDate(start, { weekday: "short", day: undefined, month: undefined });
  const isGig = event.event_type === "performance";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-5 sm:p-7",
        isGig
          ? "bg-[linear-gradient(135deg,var(--accent)_0%,var(--accent-dark)_100%)] text-accent-ink"
          : "border border-border bg-bg-2"
      )}
    >
      <div className="absolute right-5 top-5 text-right sm:right-6 sm:top-6">
        <div className="font-display text-lg font-bold leading-none sm:text-2xl">{countdown}</div>
        <div className={cn("mt-1 text-xs", isGig ? "opacity-75" : "text-text-muted")}>
          {ongoing ? "прямо сейчас" : "до начала"}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7">
        <div className="flex items-baseline gap-3 sm:block sm:min-w-[104px] sm:text-center">
          <div className="font-display text-6xl font-extrabold leading-[0.9] tracking-tight sm:text-[84px]">
            {start.getDate()}
          </div>
          <div
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.14em] sm:mt-2",
              isGig ? "opacity-80" : "text-text-muted"
            )}
          >
            {month} · {weekday}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                  isGig ? "bg-accent-ink" : "bg-accent"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  isGig ? "bg-accent-ink" : "bg-accent"
                )}
              />
            </span>
            {EVENT_TYPE_LABELS[event.event_type]} · {ongoing ? "идёт сейчас" : relativeDays(days)}
          </div>
          <h2 className="heading-poster mt-2 pr-20 text-2xl sm:text-[30px]">{event.title}</h2>
          <div
            className={cn(
              "mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm",
              isGig ? "opacity-85" : "text-text-secondary"
            )}
          >
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Clock className="h-4 w-4" />
              {timeLabel(event.starts_at)}
              {event.ends_at && ` — ${timeLabel(event.ends_at)}`}
            </span>
            {event.location && (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
            {showFee && isGig && event.fee ? (
              <span className="tabular-nums">Гонорар {formatMoney(event.fee)}</span>
            ) : null}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {event.setlist_id && (
              <Link
                href={bandPath(bandSlug, "play", event.setlist_id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-opacity hover:opacity-90",
                  isGig ? "bg-accent-ink text-accent" : "bg-accent text-accent-ink"
                )}
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Открыть сет
              </Link>
            )}
            <Link
              href={bandPath(bandSlug, "schedule", event.id, "edit")}
              className={cn(
                "inline-flex items-center rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors",
                isGig
                  ? "border-current/40 hover:bg-accent-ink/10"
                  : "border-border-strong hover:border-accent hover:text-accent"
              )}
            >
              Детали
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Сет-лист -------------------------------- */

function SetlistCard({ setlist, bandSlug }: { setlist: OverviewSetlist; bandSlug: string }) {
  const songs = setlist.items.filter((i) => i.isSong).length;
  const breaks = setlist.items.length - songs;
  // Порядковые номера только у треков, паузы не нумеруются.
  const numbers = setlist.items.reduce<number[]>((acc, item) => {
    const prev = acc.length ? acc[acc.length - 1] : 0;
    acc.push(item.isSong ? prev + 1 : prev);
    return acc;
  }, []);

  return (
    <section className="rounded-xl border border-border bg-bg-2">
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-4 sm:px-5">
        <h2 className="min-w-0 truncate text-xs font-bold uppercase tracking-wide">
          Сет-лист · {setlist.name}
        </h2>
        <Link
          href={bandPath(bandSlug, "setlists", setlist.id)}
          className="shrink-0 text-xs text-text-muted transition-colors hover:text-accent"
        >
          Редактировать
        </Link>
      </div>
      {setlist.items.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-text-muted">В сет-листе пока нет треков.</p>
      ) : (
        <ol className="px-2 pb-1 sm:px-3">
          {setlist.items.map((item, index) => {
            if (!item.isSong) {
              return (
                <li
                  key={item.id}
                  className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 px-2.5 py-2 text-sm italic text-text-muted"
                >
                  <span>—</span>
                  <span className="truncate">{item.title}</span>
                </li>
              );
            }
            return (
              <li
                key={item.id}
                className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-bg-3 sm:grid-cols-[28px_minmax(0,1fr)_44px_44px_48px]"
              >
                <span className="font-display text-xs text-text-muted tabular-nums">
                  {String(numbers[index]).padStart(2, "0")}
                </span>
                <span className="min-w-0 truncate font-medium">
                  {item.title}
                  {item.isCover && (
                    <span className="ml-1.5 text-xs font-normal text-text-muted">кавер</span>
                  )}
                </span>
                <span className="hidden text-right text-xs text-text-secondary tabular-nums sm:block">
                  {item.key ?? ""}
                </span>
                <span className="hidden text-right text-xs text-text-secondary tabular-nums sm:block">
                  {item.bpm ?? ""}
                </span>
                <span className="text-right text-xs text-text-secondary tabular-nums">
                  {item.durationSec ? formatDuration(item.durationSec) : ""}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-text-secondary sm:px-5">
        <span>
          {songs} {songs === 1 ? "трек" : songs >= 2 && songs <= 4 ? "трека" : "треков"}
          {breaks > 0 && ` · пауз: ${breaks}`}
        </span>
        <span className="font-display text-xs font-semibold text-text-primary tabular-nums">
          {setlist.totalSec ? formatDuration(setlist.totalSec) : "—"}
        </span>
      </div>
    </section>
  );
}

/* --------------------------------- Неделя ---------------------------------- */

function WeekStrip({ events, bandSlug }: { events: OverviewEvent[]; bandSlug: string }) {
  const today = startOfDay(new Date());
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dayEvents = events.filter((e) => daysBetween(d, new Date(e.starts_at)) === 0);
    return { date: d, events: dayEvents, isToday: d.getTime() === today.getTime() };
  });

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map(({ date, events: dayEvents, isToday }, i) => {
        const pad = (n: number) => String(n).padStart(2, "0");
        const param = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        const title = dayEvents.map((e) => `${timeLabel(e.starts_at)} ${e.title}`).join("\n");
        return (
          <Link
            key={param}
            href={
              dayEvents[0]
                ? bandPath(bandSlug, "schedule", dayEvents[0].id, "edit")
                : `${bandPath(bandSlug, "schedule", "new")}?date=${param}`
            }
            title={title || undefined}
            className={cn(
              "flex flex-col items-center rounded-lg py-2.5 transition-colors",
              isToday ? "bg-accent text-accent-ink" : "hover:bg-bg-3"
            )}
          >
            <span
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wider",
                isToday ? "opacity-80" : "text-text-muted"
              )}
            >
              {WEEKDAYS[i]}
            </span>
            <span className="mt-0.5 font-display text-base font-bold tabular-nums">
              {date.getDate()}
            </span>
            <span className="mt-1.5 flex h-1.5 gap-1">
              {dayEvents.slice(0, 3).map((e) => (
                <span
                  key={e.id}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isToday ? "bg-accent-ink" : DOT_CLASS[e.event_type]
                  )}
                />
              ))}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/* ---------------------------------- Дела ----------------------------------- */

function TodoPreview({
  todos,
  bandSlug,
  canToggle,
}: {
  todos: OverviewTodo[];
  bandSlug: string;
  canToggle: boolean;
}) {
  const isClient = useIsClient();
  const [, startTransition] = useTransition();
  const [done, markDone] = useOptimistic<Set<string>, string>(
    new Set(),
    (state, id) => new Set(state).add(id)
  );

  if (todos.length === 0) {
    return (
      <div className="flex items-center justify-between gap-3 px-2.5 pb-1 pt-1 text-sm text-text-muted">
        Открытых дел нет
        <Link
          href={bandPath(bandSlug, "todos")}
          className="inline-flex items-center gap-1 text-accent hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          Добавить
        </Link>
      </div>
    );
  }

  const today = startOfDay(new Date());

  return (
    <ul>
      {todos.map((todo) => {
        const isDone = done.has(todo.id);
        let due: { label: string; tone: "red" | "amber" | "muted" } | null = null;
        if (todo.due_date && isClient) {
          const d = parseDateValue(todo.due_date);
          const diff = daysBetween(today, d);
          due =
            diff < 0
              ? { label: "просрочено", tone: "red" }
              : diff === 0
                ? { label: "сегодня", tone: "amber" }
                : diff === 1
                  ? { label: "завтра", tone: "amber" }
                  : { label: formatDate(d), tone: "muted" };
        }
        return (
          <li
            key={todo.id}
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-bg-3"
          >
            <button
              type="button"
              disabled={!canToggle || isDone}
              onClick={() =>
                startTransition(async () => {
                  markDone(todo.id);
                  await toggleTodo(todo.id, bandSlug, true);
                })
              }
              className={cn(
                "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border-[1.5px] transition-colors",
                isDone
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-border-strong enabled:hover:border-accent",
                !canToggle && "cursor-default"
              )}
              aria-label="Отметить выполненным"
            >
              {isDone && <Check className="h-3 w-3" strokeWidth={3} />}
            </button>
            <span
              className={cn(
                "min-w-0 flex-1 truncate",
                isDone && "text-text-muted line-through"
              )}
            >
              {todo.title}
            </span>
            {due && (
              <span
                className={cn(
                  "shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                  due.tone === "red" && "bg-red/12 text-red",
                  due.tone === "amber" && "bg-amber/12 text-amber",
                  due.tone === "muted" && "bg-bg-3 text-text-secondary"
                )}
              >
                {due.label}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* --------------------------------- Деньги ---------------------------------- */

function FinancePreview({ finance }: { finance: NonNullable<BandOverview["finance"]> }) {
  const months = finance.months;
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
  const last = months[months.length - 1];

  return (
    <div className="px-2.5 pb-1">
      <div className="font-display text-[28px] font-bold leading-tight tabular-nums">
        {formatMoney(finance.balance)}
      </div>
      {last && (
        <div className="mt-1 flex gap-4 text-sm text-text-secondary tabular-nums">
          <span>
            {monthName(last.key)}: <span className="text-green">+{formatMoney(last.income)}</span>
          </span>
          <span>−{formatMoney(last.expense)}</span>
        </div>
      )}
      {months.length > 0 && (
        <>
          <div className="mt-4 flex h-14 items-end gap-1.5">
            {months.map((m) => (
              <div key={m.key} className="flex h-full flex-1 items-end gap-0.5">
                <span
                  className="flex-1 rounded-t-sm bg-accent"
                  style={{ height: `${Math.max(4, (m.income / max) * 100)}%` }}
                  title={`Доход: ${formatMoney(m.income)}`}
                />
                <span
                  className="flex-1 rounded-t-sm bg-bg-4"
                  style={{ height: `${Math.max(4, (m.expense / max) * 100)}%` }}
                  title={`Расход: ${formatMoney(m.expense)}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1.5">
            {months.map((m) => (
              <span key={m.key} className="flex-1 text-center text-[11px] text-text-muted">
                {monthName(m.key)}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function monthName(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("ru-RU", { month: "short" }).replace(".", "");
}

/* -------------------------------- Репертуар -------------------------------- */

function RepertoirePreview({ total, ready }: { total: number; ready: number }) {
  const pct = total ? Math.round((ready / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4 px-2.5 pb-1">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
        <Music className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm">
          <span className="font-display text-lg font-bold tabular-nums">{ready}</span>
          <span className="text-text-secondary"> из {total} треков готовы к сцене</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-4">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

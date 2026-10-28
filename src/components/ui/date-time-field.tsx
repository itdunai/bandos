"use client";

import { cn } from "@/lib/utils";
import { useIsClient } from "@/lib/use-is-client";
import { X } from "lucide-react";
import { useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTE_STEP = 5;
const BASE_MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, i) =>
  pad(i * MINUTE_STEP)
);

const controlClass =
  "rounded-lg border border-border bg-bg-3 px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-60";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

interface Parts {
  date: string;
  hour: string;
  minute: string;
}

const EMPTY: Parts = { date: "", hour: "", minute: "" };

/** UTC ISO → дата/часы/минуты в часовом поясе браузера. */
function partsFromIso(iso: string): Parts | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    hour: pad(d.getHours()),
    minute: pad(d.getMinutes()),
  };
}

/** "YYYY-MM-DDTHH:mm" (локальное «настенное» время) → части. */
function partsFromLocal(value: string): Parts | null {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(value);
  return m ? { date: m[1], hour: m[2], minute: m[3] } : null;
}

function toIso({ date, hour, minute }: Parts): string {
  if (!date || !hour || !minute) return "";
  const [y, mo, d] = date.split("-").map(Number);
  const local = new Date(y, mo - 1, d, Number(hour), Number(minute));
  return Number.isNaN(local.getTime()) ? "" : local.toISOString();
}

/** Дата другого `DateTimeField` той же формы (по имени его скрытого поля). */
function readSiblingDate(
  el: HTMLElement,
  name: string | undefined
): string {
  if (!name) return "";
  const input = el.closest("form")?.elements.namedItem(name);
  if (!(input instanceof HTMLInputElement) || !input.value) return "";
  return partsFromIso(input.value)?.date ?? "";
}

/**
 * Дата + время в 24-часовом формате без нативного `datetime-local`
 * (у него разное поведение по браузерам: AM/PM, нет выбора времени в Firefox,
 * сегментный ввод). Значения считаются только в браузере, поэтому часовой пояс
 * сервера на них не влияет. В форму уходит UTC ISO в скрытом поле `name`.
 */
export function DateTimeField({
  name,
  id,
  defaultIso,
  defaultLocal,
  defaultTime = "18:00",
  required = false,
  fallbackDateFrom,
  onDateChange,
  follow,
}: {
  name: string;
  id?: string;
  /** Сохранённое значение (UTC ISO). */
  defaultIso?: string | null;
  /** Начальное значение в локальном времени, напр. из `?date=`. */
  defaultLocal?: string;
  /** Время, подставляемое при выборе даты, если время ещё не задано. */
  defaultTime?: string;
  required?: boolean;
  /**
   * Имя другого поля формы, чья дата подставляется, если выбрали время
   * без даты (для «Конца» — `starts_at`).
   */
  fallbackDateFrom?: string;
  /** Пользователь сменил дату в этом поле: новая и прежняя дата. */
  onDateChange?: (date: string, prev: string) => void;
  /**
   * Следовать за датой другого поля (для «Конца» — за «Началом»): дата
   * подставляется, если здесь пусто или стояла прежняя дата того поля.
   * `seq` меняется при каждой смене, чтобы реагировать и на повторы.
   */
  follow?: { date: string; prev: string; seq: number };
}) {
  const isClient = useIsClient();
  const [edited, setEdited] = useState<Parts | null>(null);

  const [dh, dm] = defaultTime.split(":");
  const initial: Parts = isClient
    ? (defaultIso && partsFromIso(defaultIso)) ||
      (defaultLocal && partsFromLocal(defaultLocal)) ||
      (required ? { date: "", hour: dh, minute: dm } : EMPTY)
    : EMPTY;
  const parts = edited ?? initial;

  // Следование за другим полем — производное состояние (обновляем во время
  // рендера, без эффекта): реагируем только на новое событие `seq`.
  const [followSeq, setFollowSeq] = useState(follow?.seq ?? 0);
  if (follow && follow.seq !== followSeq) {
    setFollowSeq(follow.seq);
    if (follow.date && (!parts.date || parts.date === follow.prev)) {
      setEdited({ date: follow.date, hour: parts.hour || dh, minute: parts.minute || dm });
    }
  }

  function update(patch: Partial<Parts>, target: HTMLElement) {
    const next = { ...parts, ...patch };
    if (patch.date && !next.hour) next.hour = dh;
    if (patch.date && !next.minute) next.minute = dm;
    if ((patch.hour || patch.minute) && !next.date) {
      next.date = readSiblingDate(target, fallbackDateFrom);
    }
    if (patch.hour && !next.minute) next.minute = "00";
    setEdited(next);
    if (next.date !== parts.date) onDateChange?.(next.date, parts.date);
  }

  const minutes =
    parts.minute && !BASE_MINUTES.includes(parts.minute)
      ? [...BASE_MINUTES, parts.minute].sort()
      : BASE_MINUTES;
  const hasValue = !!(parts.date || parts.hour || parts.minute);
  const timeRequired = required || !!parts.date;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="hidden" name={name} value={toIso(parts)} />
      <input
        id={id}
        type="date"
        value={parts.date}
        required={required}
        disabled={!isClient}
        onChange={(e) => update({ date: e.target.value }, e.currentTarget)}
        className={cn(controlClass, "min-w-0 flex-1 basis-36")}
        aria-label="Дата"
      />
      <div className="flex items-center gap-1">
        <select
          value={parts.hour}
          disabled={!isClient}
          required={timeRequired}
          onChange={(e) => update({ hour: e.target.value }, e.currentTarget)}
          className={cn(controlClass, "w-[4.5rem] tabular-nums")}
          aria-label="Часы"
        >
          {!required && <option value="">чч</option>}
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-text-muted">:</span>
        <select
          value={parts.minute}
          disabled={!isClient}
          required={timeRequired}
          onChange={(e) => update({ minute: e.target.value }, e.currentTarget)}
          className={cn(controlClass, "w-[4.5rem] tabular-nums")}
          aria-label="Минуты"
        >
          {!required && <option value="">мм</option>}
          {minutes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {!required && hasValue && (
          <button
            type="button"
            onClick={() => setEdited(EMPTY)}
            className="ml-1 rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-3 hover:text-text-primary"
            aria-label="Очистить"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

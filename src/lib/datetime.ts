/**
 * Convert `<input type="datetime-local">` wall time to UTC ISO.
 * `timezoneOffsetMinutes` is `Date#getTimezoneOffset()` from the browser
 * (minutes to add to local time to get UTC).
 */
export function datetimeLocalToIso(
  value: string,
  timezoneOffsetMinutes: number
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(
      trimmed
    );
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? 0);
  const asUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  return new Date(asUtcMs + timezoneOffsetMinutes * 60_000).toISOString();
}

export function parseTimezoneOffsetMinutes(raw: FormDataEntryValue | null): number {
  if (typeof raw !== "string" || !/^-?\d{1,4}$/.test(raw)) return 0;
  return Number(raw);
}

/**
 * Parse an event date-time field. `DateTimeField` sends a UTC ISO string
 * computed in the browser (correct offset for that exact date, DST included);
 * older clients send `datetime-local` wall time plus `timezone_offset`.
 */
export function parseFormDateTime(
  value: string,
  timezoneOffsetMinutes: number
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z$/.test(trimmed)) {
    const ms = Date.parse(trimmed);
    return Number.isNaN(ms) ? null : new Date(ms).toISOString();
  }

  return datetimeLocalToIso(trimmed, timezoneOffsetMinutes);
}

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Строка даты из БД → Date. Колонки DATE (`YYYY-MM-DD`) — это календарный день
 * без часового пояса: разбираем как локальную полночь, иначе `new Date()`
 * считает их полночью UTC и западнее UTC показывается предыдущий день.
 * TIMESTAMPTZ разбирается как обычно.
 */
export function parseDateValue(value: string): Date {
  const m = DATE_ONLY_RE.exec(value);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(value);
}

/** Сегодняшняя дата `YYYY-MM-DD` в часовом поясе текущей среды (вызывать в браузере). */
export function todayDateString(now: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

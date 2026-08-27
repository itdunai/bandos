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

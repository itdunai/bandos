import { describe, expect, it } from "vitest";
import {
  datetimeLocalToIso,
  parseTimezoneOffsetMinutes,
} from "@/lib/datetime";

describe("datetimeLocalToIso", () => {
  it("converts local wall time with UTC+8 offset", () => {
    // Irkutsk / China: getTimezoneOffset() === -480
    expect(datetimeLocalToIso("2026-08-27T19:00", -480)).toBe(
      "2026-08-27T11:00:00.000Z"
    );
  });

  it("converts local wall time with UTC+3 offset", () => {
    expect(datetimeLocalToIso("2026-08-27T19:00", -180)).toBe(
      "2026-08-27T16:00:00.000Z"
    );
  });

  it("keeps UTC wall time when offset is 0", () => {
    expect(datetimeLocalToIso("2026-08-27T19:00", 0)).toBe(
      "2026-08-27T19:00:00.000Z"
    );
  });

  it("returns null for empty or invalid values", () => {
    expect(datetimeLocalToIso("", -480)).toBeNull();
    expect(datetimeLocalToIso("not-a-date", -480)).toBeNull();
  });
});

describe("parseTimezoneOffsetMinutes", () => {
  it("parses signed integer offsets", () => {
    expect(parseTimezoneOffsetMinutes("-480")).toBe(-480);
    expect(parseTimezoneOffsetMinutes("0")).toBe(0);
    expect(parseTimezoneOffsetMinutes("120")).toBe(120);
  });

  it("falls back to 0 for invalid values", () => {
    expect(parseTimezoneOffsetMinutes(null)).toBe(0);
    expect(parseTimezoneOffsetMinutes("abc")).toBe(0);
  });
});

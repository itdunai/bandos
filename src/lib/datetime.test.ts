import { describe, expect, it } from "vitest";
import {
  datetimeLocalToIso,
  parseFormDateTime,
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

describe("parseFormDateTime", () => {
  it("accepts UTC ISO from the client as is", () => {
    expect(parseFormDateTime("2026-08-27T16:00:00.000Z", 0)).toBe(
      "2026-08-27T16:00:00.000Z"
    );
    expect(parseFormDateTime("2026-08-27T16:00Z", -480)).toBe(
      "2026-08-27T16:00:00.000Z"
    );
  });

  it("falls back to datetime-local wall time with offset", () => {
    expect(parseFormDateTime("2026-08-27T19:00", -180)).toBe(
      "2026-08-27T16:00:00.000Z"
    );
  });

  it("returns null for empty or invalid values", () => {
    expect(parseFormDateTime("", 0)).toBeNull();
    expect(parseFormDateTime("2026-13-45T99:99Z", 0)).toBeNull();
    expect(parseFormDateTime("garbage", 0)).toBeNull();
  });
});

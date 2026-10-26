import { describe, expect, it } from "vitest";
import { localParts, relativeDay, safeTimeZone } from "@/lib/telegram/notify";
import { escapeHtml, secretsEqual } from "@/lib/telegram/bot";

describe("localParts", () => {
  it("returns the calendar day and hour in the recipient's timezone", () => {
    const at = new Date("2026-10-24T22:30:00Z");
    expect(localParts(at, "UTC")).toEqual({ date: "2026-10-24", hour: 22 });
    expect(localParts(at, "Europe/Moscow")).toEqual({ date: "2026-10-25", hour: 1 });
    expect(localParts(at, "America/Los_Angeles")).toEqual({ date: "2026-10-24", hour: 15 });
  });
});

describe("relativeDay", () => {
  const now = new Date("2026-10-24T20:00:00Z");

  it("says «завтра» relative to the recipient's local day", () => {
    // 19:00 МСК 25-го: для Москвы это «завтра»
    expect(relativeDay("2026-10-25T16:00:00Z", "Europe/Moscow", now)).toBe("завтра");
  });

  it("says «сегодня» when the event is later the same local day", () => {
    // Во Владивостоке (UTC+10) сейчас уже 25-е 06:00 — событие в 19:00 25-го «сегодня»
    expect(relativeDay("2026-10-25T09:00:00Z", "Asia/Vladivostok", now)).toBe("сегодня");
  });

  it("returns null for dates further away", () => {
    expect(relativeDay("2026-10-28T16:00:00Z", "Europe/Moscow", now)).toBeNull();
  });
});

describe("safeTimeZone", () => {
  it("falls back to UTC for unknown zones", () => {
    expect(safeTimeZone("Europe/Moscow")).toBe("Europe/Moscow");
    expect(safeTimeZone("Mars/Olympus")).toBe("UTC");
  });
});

describe("bot helpers", () => {
  it("escapes HTML for parse_mode=HTML", () => {
    expect(escapeHtml("<b>Rock & Roll</b>")).toBe("&lt;b&gt;Rock &amp; Roll&lt;/b&gt;");
  });

  it("compares secrets safely", () => {
    expect(secretsEqual("abcdef1234567890", "abcdef1234567890")).toBe(true);
    expect(secretsEqual("abcdef1234567890", "abcdef1234567891")).toBe(false);
    expect(secretsEqual("short", "abcdef1234567890")).toBe(false);
    expect(secretsEqual(null, "abcdef1234567890")).toBe(false);
    expect(secretsEqual("", "")).toBe(false);
  });
});

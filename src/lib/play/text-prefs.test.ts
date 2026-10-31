import { describe, expect, it } from "vitest";
import {
  clampScale,
  DEFAULT_PLAY_TEXT_PREFS,
  parsePlayTextPrefs,
  playFontClass,
} from "@/lib/play/text-prefs";

describe("parsePlayTextPrefs", () => {
  it("falls back to defaults for garbage", () => {
    expect(parsePlayTextPrefs(null)).toEqual(DEFAULT_PLAY_TEXT_PREFS);
    expect(parsePlayTextPrefs({ scale: "big", align: "right", font: "comic" })).toEqual(
      DEFAULT_PLAY_TEXT_PREFS
    );
  });

  it("keeps valid values and clamps the scale", () => {
    expect(parsePlayTextPrefs({ scale: 9, align: "left", font: "serif", updatedAt: 5 })).toEqual({
      scale: 2.5,
      align: "left",
      font: "serif",
      updatedAt: 5,
    });
  });
});

describe("clampScale", () => {
  it("rounds to one decimal within range", () => {
    expect(clampScale(1.1 + 0.1)).toBe(1.2);
    expect(clampScale(0.1)).toBe(0.4);
  });
});

describe("playFontClass", () => {
  it("keeps tabs monospaced and auto-splits chords and lyrics", () => {
    expect(playFontClass("serif", "tabs")).toBe("font-mono");
    expect(playFontClass("auto", "chords")).toBe("font-mono");
    expect(playFontClass("auto", "lyrics")).toBe("font-sans");
    expect(playFontClass("serif", "lyrics")).toBe("font-serif");
  });
});

import { describe, expect, it } from "vitest";
import {
  clampScale,
  DEFAULT_PLAY_TEXT_PREFS,
  parsePlayTextPrefs,
  resolvePlayFont,
} from "@/lib/play/text-prefs";

describe("parsePlayTextPrefs", () => {
  it("falls back to defaults for garbage", () => {
    expect(parsePlayTextPrefs(null)).toEqual(DEFAULT_PLAY_TEXT_PREFS);
    expect(parsePlayTextPrefs({ scale: "big", align: "right", font: "comic" })).toEqual(
      DEFAULT_PLAY_TEXT_PREFS
    );
  });

  it("keeps valid values and clamps the scale", () => {
    expect(parsePlayTextPrefs({ scale: 9, align: "left", font: "inter", updatedAt: 5 })).toEqual({
      scale: 2.5,
      align: "left",
      font: "inter",
      updatedAt: 5,
    });
  });

  it("maps fonts from the first version of the settings", () => {
    expect(parsePlayTextPrefs({ font: "mono" }).font).toBe("jetbrains");
    expect(parsePlayTextPrefs({ font: "sans" }).font).toBe("golos");
    expect(parsePlayTextPrefs({ font: "serif" }).font).toBe("golos");
  });
});

describe("clampScale", () => {
  it("rounds to one decimal within range", () => {
    expect(clampScale(1.1 + 0.1)).toBe(1.2);
    expect(clampScale(0.1)).toBe(0.4);
  });
});

describe("resolvePlayFont", () => {
  it("keeps tabs monospaced and auto-splits chords and lyrics", () => {
    expect(resolvePlayFont("nunito", "tabs")).toBe("site-mono");
    expect(resolvePlayFont("jetbrains", "tabs")).toBe("jetbrains");
    expect(resolvePlayFont("auto", "chords")).toBe("site-mono");
    expect(resolvePlayFont("auto", "lyrics")).toBe("site-sans");
    expect(resolvePlayFont("inter", "lyrics")).toBe("inter");
  });
});

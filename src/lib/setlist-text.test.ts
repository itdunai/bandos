import { describe, expect, it } from "vitest";
import { formatMinutes, setlistToText } from "@/lib/setlist-text";

describe("setlistToText", () => {
  it("numbers tracks inside each block", () => {
    const text = setlistToText("Пятница, клуб", [
      { title: "Блок 1", isSection: true },
      { title: "Ночная трасса", durationSec: 240 },
      { title: "Эхо", durationSec: 200 },
      { title: "Бис", isSection: true },
      { title: "Сигналы", durationSec: 180 },
    ]);
    expect(text).toBe(
      [
        "Сет-лист «Пятница, клуб»",
        "3 трека · 10 мин",
        "",
        "Блок 1 (7 мин)",
        "1. Ночная трасса",
        "2. Эхо",
        "",
        "Бис (3 мин)",
        "1. Сигналы",
      ].join("\n")
    );
  });

  it("works without blocks and durations", () => {
    expect(setlistToText("Репетиция", [{ title: "Intro" }, { title: "Эхо" }])).toBe(
      ["Сет-лист «Репетиция»", "2 трека", "", "1. Intro", "2. Эхо"].join("\n")
    );
  });

  it("handles an empty setlist", () => {
    expect(setlistToText("Пусто", [])).toBe("Сет-лист «Пусто»\n0 треков");
  });
});

describe("formatMinutes", () => {
  it("rounds to minutes and switches to hours", () => {
    expect(formatMinutes(50 * 60 + 20)).toBe("50 мин");
    expect(formatMinutes(65 * 60)).toBe("1 ч 05 мин");
    expect(formatMinutes(120 * 60)).toBe("2 ч");
  });
});

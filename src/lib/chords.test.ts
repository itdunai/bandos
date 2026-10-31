import { describe, expect, it } from "vitest";
import {
  detectNotation,
  isChord,
  isChordLine,
  parseChordSheet,
  transposeChord,
  transposeKey,
} from "@/lib/chords";

const SHARP = { useH: false, preferFlats: false };
const FLAT = { useH: false, preferFlats: true };
const RUS = { useH: true, preferFlats: false };

const text = (line: { segments: { text: string }[] }) => line.segments.map((s) => s.text).join("");

describe("isChord", () => {
  it.each(["Am", "C", "F#m7", "D#m", "G/B", "Cmaj7", "Dsus4", "Bbm", "E7#9", "C(add9)", "Hm", "A7b9"])(
    "%s is a chord",
    (c) => expect(isChord(c)).toBe(true)
  );
  it.each(["Пепел", "Hello", "And", "Am,", "x2", "Ab3c"])("%s is not a chord", (c) =>
    expect(isChord(c)).toBe(false)
  );
});

describe("isChordLine", () => {
  it("detects chord lines with fillers and labels", () => {
    expect(isChordLine("   G#m            E")).toBe(true);
    expect(isChordLine("Intro: Am | F | C | G  x2")).toBe(true);
    expect(isChordLine("[Припев] Am F")).toBe(true);
  });
  it("leaves lyrics alone", () => {
    expect(isChordLine("Пульс его теперь в твоих глазах,")).toBe(false);
    expect(isChordLine("A Day In The Life")).toBe(false);
    expect(isChordLine("")).toBe(false);
    expect(isChordLine("Intro:")).toBe(false);
  });
});

describe("transposeChord", () => {
  it("shifts root and bass, keeps the suffix", () => {
    expect(transposeChord("Am", 2, SHARP)).toBe("Bm");
    expect(transposeChord("E", 2, SHARP)).toBe("F#");
    expect(transposeChord("G/B", 1, FLAT)).toBe("Ab/C");
    expect(transposeChord("F#m7b5", -1, SHARP)).toBe("Fm7b5");
    expect(transposeChord("B", 1, SHARP)).toBe("C");
    expect(transposeChord("C", -1, SHARP)).toBe("B");
    expect(transposeChord("Dm", 12, SHARP)).toBe("Dm");
  });

  it("supports Russian H/B notation", () => {
    expect(transposeChord("Hm", 1, RUS)).toBe("Cm");
    expect(transposeChord("A", 2, RUS)).toBe("H");
    expect(transposeChord("A", 1, RUS)).toBe("B");
    expect(transposeChord("B", 1, RUS)).toBe("H");
  });
});

describe("detectNotation", () => {
  it("prefers the accidentals the sheet already uses", () => {
    expect(detectNotation("Bb  Eb\nслова").preferFlats).toBe(true);
    expect(detectNotation("F#  C#m").preferFlats).toBe(false);
    expect(detectNotation("Hm  G").useH).toBe(true);
    expect(detectNotation("[Bb]Слова").preferFlats).toBe(true);
  });
});

describe("parseChordSheet", () => {
  it("marks chords and keeps lyrics as is", () => {
    const lines = parseChordSheet("G#m            E\nПульс его теперь");
    expect(lines[0].kind).toBe("chords");
    expect(lines[0].segments.filter((s) => s.chord).map((s) => s.text)).toEqual(["G#m", "E"]);
    expect(lines[1]).toEqual({ kind: "lyrics", segments: [{ text: "Пульс его теперь" }] });
  });

  it("keeps chord columns when chords grow after transposing", () => {
    const [line] = parseChordSheet("  E   A  E", 2, SHARP);
    expect(text(line)).toBe("  F#  B  F#");
    const [tight] = parseChordSheet("E A", 2, SHARP);
    expect(text(tight)).toBe("F# B");
  });

  it("transposes inline [chords] inside lyrics", () => {
    const [line] = parseChordSheet("[Am]Пепел [F]любви", 2, SHARP);
    expect(line.kind).toBe("lyrics");
    expect(text(line)).toBe("[Bm]Пепел [G]любви");
    expect(line.segments.filter((s) => s.chord)).toHaveLength(2);
  });
});

describe("transposeKey", () => {
  it("follows the sheet notation", () => {
    expect(transposeKey("Em", 2, SHARP)).toBe("F#m");
    expect(transposeKey("Hm", 1, RUS)).toBe("Cm");
    expect(transposeKey("не указано", 2, SHARP)).toBe("не указано");
  });
});

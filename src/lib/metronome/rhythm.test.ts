import { describe, expect, it } from "vitest";
import {
  beatGroups,
  bpmFromTaps,
  clampBpm,
  defaultAccents,
  isSilentBar,
  nextAccent,
  trainerBpm,
} from "@/lib/metronome/rhythm";

describe("defaultAccents", () => {
  it.each([
    ["4/4", [3, 1, 2, 1]],
    ["3/4", [3, 1, 1]],
    ["2/4", [3, 1]],
    ["5/4", [3, 1, 1, 2, 1]],
    ["6/8", [3, 1, 1, 2, 1, 1]],
    ["7/8", [3, 1, 2, 1, 2, 1, 1]],
    ["12/8", [3, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1]],
  ])("%s", (ts, expected) => {
    expect(defaultAccents(ts)).toEqual(expected);
  });

  it("falls back to 4/4 for garbage", () => {
    expect(defaultAccents("abc")).toEqual([3, 1, 2, 1]);
  });

  it("groups odd eighths as 2+…+3", () => {
    expect(beatGroups("5/8")).toEqual([2, 3]);
    expect(beatGroups("9/8")).toEqual([3, 3, 3]);
  });
});

describe("nextAccent", () => {
  it("cycles accent → mid → weak → rest → accent", () => {
    expect([3, 2, 1, 0].map((l) => nextAccent(l as 0 | 1 | 2 | 3))).toEqual([2, 1, 0, 3]);
  });
});

describe("bpmFromTaps", () => {
  it("averages intervals", () => {
    expect(bpmFromTaps([0, 500, 1000, 1500])).toBe(120);
  });
  it("needs two taps", () => {
    expect(bpmFromTaps([100])).toBeNull();
  });
  it("clamps to range", () => {
    expect(bpmFromTaps([0, 10])).toBe(300);
    expect(clampBpm(5)).toBe(30);
  });
});

describe("training", () => {
  const trainer = { enabled: true, step: 2, everyBars: 4, maxBpm: 130 };

  it("speeds up every N bars up to the limit", () => {
    expect(trainerBpm(120, 0, trainer)).toBe(120);
    expect(trainerBpm(120, 3, trainer)).toBe(120);
    expect(trainerBpm(120, 4, trainer)).toBe(122);
    expect(trainerBpm(129, 8, trainer)).toBe(130);
    expect(trainerBpm(130, 12, trainer)).toBe(130);
    expect(trainerBpm(120, 4, { ...trainer, enabled: false })).toBe(120);
  });

  it("mutes bars after the played ones", () => {
    const gap = { enabled: true, playBars: 3, muteBars: 1 };
    expect([0, 1, 2, 3, 4, 7].map((b) => isSilentBar(b, gap))).toEqual([
      false, false, false, true, false, true,
    ]);
    expect(isSilentBar(3, { ...gap, enabled: false })).toBe(false);
  });
});

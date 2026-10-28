"use client";

import type { MetronomePulse } from "@/lib/metronome/engine";
import { ACCENT_LABELS, type AccentLevel } from "@/lib/metronome/rhythm";
import { cn } from "@/lib/utils";

const FILL: Record<AccentLevel, string> = {
  3: "h-full bg-accent/50",
  2: "h-2/3 bg-accent/35",
  1: "h-1/3 bg-accent/20",
  0: "h-0",
};

/** Доли такта. Высота заливки — сила доли; клик меняет её по кругу. */
export function BeatCells({
  levels,
  pulse,
  subdivision,
  onCycle,
  size = "lg",
}: {
  levels: AccentLevel[];
  pulse: MetronomePulse;
  subdivision: number;
  onCycle: (index: number) => void;
  size?: "lg" | "sm";
}) {
  const audible = pulse.phase === "play" || pulse.phase === "count";
  const dense = levels.length > 8;

  return (
    <div className={cn("flex", dense ? "gap-1" : "gap-1.5 sm:gap-2")}>
      {levels.map((level, i) => {
        const active = audible && pulse.beat === i;
        return (
          <div key={i} className="flex min-w-0 flex-1 flex-col gap-2">
            <button
              type="button"
              onClick={() => onCycle(i)}
              aria-label={`Доля ${i + 1}: ${ACCENT_LABELS[level]}. Нажмите, чтобы сменить`}
              className={cn(
                "relative flex w-full flex-col justify-end overflow-hidden rounded-lg border transition-colors",
                size === "lg" ? "h-28 sm:h-36" : "h-16",
                level === 0 ? "border-dashed border-border-strong" : "border-border",
                active
                  ? "border-accent bg-bg-4 ring-[3px] ring-accent/35"
                  : "bg-bg-2 hover:border-border-strong"
              )}
            >
              <span
                className={cn(
                  "absolute left-2 top-1.5 font-display font-bold sm:left-3 sm:top-2.5",
                  size === "lg" ? "text-sm sm:text-[15px]" : "text-xs",
                  active ? "text-text-primary" : "text-text-secondary"
                )}
              >
                {level === 0 ? "—" : i + 1}
              </span>
              <span
                className={cn(
                  "block w-full transition-colors duration-75",
                  FILL[level],
                  active && level > 0 && "bg-accent"
                )}
              />
            </button>
            {subdivision > 1 && size === "lg" && (
              <div className="flex h-1.5 justify-center gap-1" aria-hidden>
                {Array.from({ length: subdivision }, (_, k) => (
                  <span
                    key={k}
                    className={cn(
                      "h-1.5 rounded-[1px]",
                      k === 0 ? "w-2.5" : "w-1.5",
                      active && pulse.subdivision === k
                        ? "bg-accent"
                        : k === 0
                          ? "bg-border-strong"
                          : "bg-bg-4"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

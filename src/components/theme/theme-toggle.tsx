"use client";

import { useTheme } from "@/components/theme/theme-provider";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

const OPTIONS: { value: Theme; label: string; Icon: typeof Moon }[] = [
  { value: "dark", label: "Тёмная", Icon: Moon },
  { value: "light", label: "Светлая", Icon: Sun },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Тема оформления"
      className={cn(
        "inline-flex shrink-0 rounded-lg border border-border bg-bg-3 p-0.5",
        className
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              active
                ? "bg-accent text-accent-ink"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

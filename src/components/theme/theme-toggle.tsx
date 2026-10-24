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
      className={cn("flex rounded-lg border border-border bg-bg-3 p-0.5", className)}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-accent text-accent-ink"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

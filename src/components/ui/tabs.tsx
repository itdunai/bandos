"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

export function Tabs({
  tabs,
  defaultTab,
  className,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  defaultTab?: string;
  className?: string;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? "");

  if (!tabs.length) return null;

  const currentId = tabs.some((t) => t.id === active) ? active : tabs[0].id;

  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              "px-3 py-2 text-sm transition-colors -mb-px border-b-2",
              currentId === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Все панели остаются в DOM: поля формы из неактивных вкладок тоже отправляются. */}
      {tabs.map((tab) => (
        <div key={tab.id} hidden={tab.id !== currentId}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}

"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function PendingOverlay({
  pending,
  label = "Сохранение…",
  children,
}: {
  pending: boolean;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {pending && (
        <div
          className="absolute inset-0 z-10 flex items-start justify-center rounded-xl bg-bg/60 pt-10"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-2 px-4 py-2.5 text-sm shadow-lg">
            <Spinner size="md" />
            {label}
          </div>
        </div>
      )}
      <div className={cn(pending && "pointer-events-none opacity-60")}>
        {children}
      </div>
    </div>
  );
}

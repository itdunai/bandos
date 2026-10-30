"use client";

import { duplicateSetlist } from "@/app/actions/setlists";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";
import { useTransition } from "react";

/** Копия сет-листа: после создания открывается копия. */
export function CopySetlistButton({
  setlistId,
  setlistName,
  bandSlug,
  className,
}: {
  setlistId: string;
  setlistName: string;
  bandSlug: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => duplicateSetlist(setlistId, bandSlug))}
      title="Сделать копию"
      aria-label={`Сделать копию сет-листа «${setlistName}»`}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-3 hover:text-accent disabled:opacity-50",
        pending && "animate-pulse",
        className
      )}
    >
      <Copy className="h-4 w-4" />
    </button>
  );
}

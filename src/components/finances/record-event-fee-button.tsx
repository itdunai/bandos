"use client";

import { recordEventFeeIncome } from "@/app/actions/finances";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useTransition } from "react";

export function RecordEventFeeButton({
  eventId,
  bandId,
  bandSlug,
  compact,
}: {
  eventId: string;
  bandId: string;
  bandSlug: string;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="default"
      size="sm"
      loading={pending}
      disabled={pending}
      className={compact ? "h-6 px-2 text-[10px]" : "text-xs"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          await recordEventFeeIncome(eventId, bandId, bandSlug);
        });
      }}
    >
      <Wallet className="h-3 w-3" />
      {compact ? (pending ? "…" : "В финансы") : pending ? "Учёт…" : "Учесть гонорар"}
    </Button>
  );
}

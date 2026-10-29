"use client";

import { runBackupNow } from "@/app/actions/platform-admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { Send } from "lucide-react";
import { useTransition } from "react";

export function BackupNowButton({ disabledReason }: { disabledReason?: string }) {
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();

  const button = (
    <Button
      type="button"
      variant="accent"
      size="sm"
      disabled={pending || !!disabledReason}
      title={disabledReason}
      onClick={() =>
        startTransition(async () => {
          const res = await runBackupNow();
          showToast(res.ok ? "success" : "error", res.message);
        })
      }
    >
      <Send className="h-4 w-4" />
      {pending ? "Делаем копию…" : "Отправить копию в Telegram"}
    </Button>
  );
  return disabledReason ? (
    <div className="flex flex-col gap-1">
      {button}
      <span className="text-xs text-text-muted">{disabledReason}</span>
    </div>
  ) : (
    button
  );
}

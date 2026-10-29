"use client";

import { runBackupNow } from "@/app/actions/platform-admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { Send } from "lucide-react";
import { useTransition } from "react";

export function BackupNowButton() {
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="accent"
      size="sm"
      disabled={pending}
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
}

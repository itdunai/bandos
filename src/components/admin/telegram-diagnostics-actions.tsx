"use client";

import {
  adminRegisterTelegramWebhook,
  adminSendTelegramTest,
} from "@/app/actions/platform-telegram";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCw, Send, Webhook } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function TelegramDiagnosticsActions() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function run(key: string, action: () => Promise<{ ok: boolean; message: string }>) {
    setBusy(key);
    setResult(null);
    startTransition(async () => {
      const r = await action();
      setResult(r);
      setBusy(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          loading={pending && busy === "refresh"}
          disabled={pending}
          onClick={() => {
            setBusy("refresh");
            setResult(null);
            startTransition(() => {
              router.refresh();
              setBusy(null);
            });
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Проверить снова
        </Button>
        <Button
          type="button"
          loading={pending && busy === "webhook"}
          disabled={pending}
          onClick={() => run("webhook", adminRegisterTelegramWebhook)}
        >
          <Webhook className="h-4 w-4" />
          Перерегистрировать webhook
        </Button>
        <Button
          type="button"
          variant="accent"
          loading={pending && busy === "test"}
          disabled={pending}
          onClick={() => run("test", adminSendTelegramTest)}
        >
          <Send className="h-4 w-4" />
          Отправить тест мне в Telegram
        </Button>
      </div>
      {result && (
        <p
          className={cn(
            "rounded-md border px-3 py-2 text-sm",
            result.ok ? "border-green/30 bg-green/10 text-green" : "border-red/30 bg-red/10 text-red"
          )}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}

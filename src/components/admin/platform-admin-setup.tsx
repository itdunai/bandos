"use client";

import { bootstrapPlatformAdmin } from "@/app/actions/platform-admin";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";

export function PlatformAdminSetup({
  userEmail,
}: {
  userEmail: string;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-amber/40 bg-amber/10 p-4 text-sm">
      <p className="font-medium text-amber">Нужна настройка БД</p>
      <p className="mt-1 text-xs text-text-secondary">
        Email <span className="text-text-primary">{userEmail}</span> есть в{" "}
        <code className="text-accent">PLATFORM_ADMIN_EMAILS</code>, но в профиле
        ещё нет флага <code className="text-accent">is_platform_admin</code>.
        Статистика и журнал заработают после одного из шагов ниже.
      </p>
      <div className="mt-3 space-y-2 text-xs text-text-secondary">
        <p>
          <strong className="text-text-primary">Вариант A:</strong> добавьте{" "}
          <code className="text-accent">SUPABASE_SERVICE_ROLE_KEY</code> в{" "}
          <code className="text-accent">.env</code> и нажмите кнопку.
        </p>
        <Button
          type="button"
          variant="accent"
          size="sm"
          loading={pending}
          disabled={pending}
          onClick={() => {
            setMessage(null);
            startTransition(async () => {
              const result = await bootstrapPlatformAdmin();
              setMessage(
                result.ok
                  ? "Готово. Обновите страницу."
                  : (result.error ?? "Ошибка")
              );
            });
          }}
        >
          Выдать права в БД
        </Button>
        <p>
          <strong className="text-text-primary">Вариант B:</strong> SQL в Supabase:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-bg-3 p-2 text-[11px] text-text-primary">
          {`UPDATE public.profiles\nSET is_platform_admin = true\nWHERE id = (\n  SELECT id FROM auth.users WHERE email = '${userEmail}'\n);`}
        </pre>
      </div>
      {message && <p className="mt-2 text-xs text-accent">{message}</p>}
    </div>
  );
}

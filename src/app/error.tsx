"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import { ErrorScreen } from "@/components/error-screen";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const digest =
    error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <ErrorScreen
      code="Упс"
      title="Что-то пошло не так"
      description="Мы уже получили отчёт об ошибке. Попробуйте ещё раз — чаще всего это помогает."
    >
      <Button variant="accent" onClick={() => retry()}>
        Попробовать снова
      </Button>
      <Link
        href="/"
        className="rounded-lg border border-border-strong px-3.5 py-2 text-sm font-semibold hover:border-accent hover:text-accent"
      >
        На главную
      </Link>
      <p className="w-full pt-2 text-xs text-text-muted">
        Повторяется?{" "}
        <Link href="/feedback" className="text-accent hover:underline">
          Напишите нам
        </Link>
        {digest && <> · код {digest}</>}
      </p>
    </ErrorScreen>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import {
  COOKIE_CONSENT_ACCEPTED,
  COOKIE_CONSENT_STORAGE_KEY,
  isCookieConsentAccepted,
} from "@/lib/legal/cookie-consent";
import { PRIVACY_PAGE_PATH } from "@/lib/legal/constants";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

function readStoredConsent(): string | null {
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function CookieConsentBanner() {
  const isClient = useIsClient();
  const [accepted, setAccepted] = useState(false);

  const visible =
    isClient && !accepted && !isCookieConsentAccepted(readStoredConsent());

  useEffect(() => {
    if (!visible) return;
    document.documentElement.classList.add("cookie-consent-open");
    return () => {
      document.documentElement.classList.remove("cookie-consent-open");
    };
  }, [visible]);

  function accept() {
    try {
      window.localStorage.setItem(
        COOKIE_CONSENT_STORAGE_KEY,
        COOKIE_CONSENT_ACCEPTED
      );
    } catch {
      // приватный режим — баннер просто скроем в этой сессии
    }
    setAccepted(true);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Согласие на использование cookie"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-bg-2/95 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] backdrop-blur md:p-5"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-text-secondary">
          Мы используем файлы cookie, чтобы сайт работал (вход в аккаунт,
          настройки) и чтобы запомнить ваше согласие. Подробности — в{" "}
          <Link
            href={PRIVACY_PAGE_PATH}
            className="text-accent underline-offset-2 hover:underline"
          >
            Политике конфиденциальности
          </Link>
          .
        </p>
        <Button
          type="button"
          variant="accent"
          className="shrink-0 px-5"
          onClick={accept}
        >
          Принять
        </Button>
      </div>
    </div>
  );
}

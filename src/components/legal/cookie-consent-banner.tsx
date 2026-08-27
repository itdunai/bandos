import { acceptCookieConsent } from "@/app/actions/cookie-consent";
import { SubmitButton } from "@/components/ui/submit-button";
import { PRIVACY_PAGE_PATH } from "@/lib/legal/constants";
import Link from "next/link";

export function CookieConsentBanner() {
  return (
    <div
      role="region"
      aria-label="Согласие на использование cookie"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-bg-2/95 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] backdrop-blur md:p-5"
    >
      <form
        action={acceptCookieConsent}
        className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
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
        <SubmitButton
          type="submit"
          variant="accent"
          className="shrink-0 px-5"
          loadingLabel="Сохраняем…"
        >
          Принять
        </SubmitButton>
      </form>
    </div>
  );
}

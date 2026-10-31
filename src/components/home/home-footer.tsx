import Link from "next/link";
import { SiteLogo } from "@/components/brand/site-logo";
import { TelegramIcon } from "@/components/brand/telegram-icon";
import { TELEGRAM_CHANNEL_URL } from "@/lib/links";
import { bandPath } from "@/lib/paths";

export function HomeFooter({
  user = false,
  firstBandSlug,
}: {
  user?: boolean;
  firstBandSlug?: string;
}) {
  return (
    <footer className="border-t border-border bg-bg-2 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
        <Link href="/" className="flex items-center">
          <SiteLogo className="h-8" />
        </Link>
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-text-muted">
          <Link href="/#catalog" className="hover:text-text-primary">
            Каталог групп
          </Link>
          <a
            href={TELEGRAM_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-text-primary"
          >
            <TelegramIcon className="h-4 w-4" />
            Telegram
          </a>
          <Link href="/privacy" className="hover:text-text-primary">
            Политика конфиденциальности
          </Link>
          {user ? (
            <Link
              href={firstBandSlug ? bandPath(firstBandSlug) : "/new-band"}
              className="font-medium text-accent hover:underline"
            >
              {firstBandSlug ? "Личный кабинет" : "Создать группу"}
            </Link>
          ) : (
            <>
              <Link href="/login" className="hover:text-text-primary">
                Вход
              </Link>
              <Link href="/register" className="hover:text-text-primary">
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </div>
    </footer>
  );
}

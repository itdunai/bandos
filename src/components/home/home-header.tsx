import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteLogo } from "@/components/brand/site-logo";
import { LogIn, Plus } from "lucide-react";
import { bandPath } from "@/lib/paths";

export function HomeHeader({
  user,
  firstBandSlug,
}: {
  user: boolean;
  firstBandSlug?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink items-center">
          <SiteLogo className="h-7 max-w-[100px] sm:h-10 sm:max-w-none" priority />
        </Link>

        <nav className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="#catalog"
            className="hidden text-xs text-text-secondary transition-colors hover:text-text-primary sm:inline"
          >
            Каталог групп
          </Link>
          {user ? (
            <>
              {firstBandSlug && (
                <Link href={bandPath(firstBandSlug)}>
                  <Button variant="default" size="sm">
                    В личный кабинет
                  </Button>
                </Link>
              )}
              <Link href="/new-band">
                <Button variant="accent" size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Создать группу
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="default" size="sm">
                  <LogIn className="h-3.5 w-3.5" />
                  Войти
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="accent" size="sm">
                  Начать бесплатно
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

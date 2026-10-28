"use client";

import { HOME_NAV } from "@/components/home/home-nav";
import { Button } from "@/components/ui/button";
import { bandPath } from "@/lib/paths";
import { LayoutDashboard, LogIn, Menu, Plus, UserCog, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";


/** Мобильная шапка главной: иконки действий и бургер с разделами. */
export function HomeMobileMenu({
  user,
  firstBandSlug,
}: {
  user: boolean;
  firstBandSlug?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const iconBtn =
    "flex h-10 w-10 items-center justify-center rounded-lg border border-border-strong text-text-primary transition-colors hover:border-accent hover:text-accent";

  return (
    <div className="flex items-center gap-2 md:hidden">
      {user ? (
        <>
          {firstBandSlug && (
            <Link href={bandPath(firstBandSlug)} className={iconBtn} aria-label="Личный кабинет" title="Личный кабинет">
              <LayoutDashboard className="h-5 w-5" />
            </Link>
          )}
          <Link
            href="/new-band"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-ink transition-colors hover:bg-accent-dark"
            aria-label="Создать группу"
            title="Создать группу"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </>
      ) : (
        <Link href="/login" className={iconBtn} aria-label="Войти" title="Войти">
          <LogIn className="h-5 w-5" />
        </Link>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={iconBtn}
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
        aria-controls="home-mobile-menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Закрыть меню"
            className="absolute inset-x-0 top-full z-40 h-screen bg-black/40"
            onClick={() => setOpen(false)}
          />
          <nav
            id="home-mobile-menu"
            className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-64px)] overflow-y-auto border-b border-border bg-bg px-4 pb-5 pt-2 shadow-xl"
          >
            <ul>
              {HOME_NAV.map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={`/${href}`}
                    onClick={() => setOpen(false)}
                    className="heading-poster block border-b border-border py-4 text-lg"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-2">
              {user ? (
                <>
                  {firstBandSlug && (
                    <Link href={bandPath(firstBandSlug)} onClick={() => setOpen(false)}>
                      <Button variant="default" size="lg" className="w-full">
                        <LayoutDashboard className="h-4 w-4" />
                        Личный кабинет
                      </Button>
                    </Link>
                  )}
                  <Link href="/new-band" onClick={() => setOpen(false)}>
                    <Button variant="accent" size="lg" className="w-full">
                      <Plus className="h-4 w-4" />
                      Создать группу
                    </Button>
                  </Link>
                  <Link href="/account" onClick={() => setOpen(false)}>
                    <Button variant="ghost" size="lg" className="w-full">
                      <UserCog className="h-4 w-4" />
                      Аккаунт
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    <Button variant="accent" size="lg" className="w-full">
                      Начать бесплатно
                    </Button>
                  </Link>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button variant="default" size="lg" className="w-full">
                      <LogIn className="h-4 w-4" />
                      Войти
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}

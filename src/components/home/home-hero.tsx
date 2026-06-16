import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Guitar } from "lucide-react";

export function HomeHero({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(124,95,232,0.35),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-accent">
            <Guitar className="h-3.5 w-3.5" />
            Для кавер- и авторских групп
          </p>
          <h1 className="text-3xl font-medium leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Всё для группы&nbsp;— в одном месте
          </h1>
          <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">
            Репертуар, сет-листы, режим «Играем» на сцене, график репетиций и
            концертов, финансы и публичная страница для заказчиков. Без
            таблиц в мессенджерах и потерянных файлов.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {isLoggedIn ? (
              <Link href="/new-band">
                <Button variant="accent" size="lg">
                  Создать группу
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button variant="accent" size="lg">
                    Создать группу бесплатно
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="default" size="lg">
                    Уже есть аккаунт
                  </Button>
                </Link>
              </>
            )}
            <Link href="#catalog">
              <Button variant="ghost" size="lg">
                Смотреть группы
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

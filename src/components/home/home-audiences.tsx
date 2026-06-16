import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mic2, Music } from "lucide-react";

export function HomeAudiences({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="border-b border-border py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="mb-8 text-center text-2xl font-medium sm:text-3xl">
          Для кого этот сервис
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-2 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Music className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium">Музыкантам и группам</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Храните материалы в одном месте, готовьтесь к репетициям и
              выступлениям, делитесь сет-листом на сцене. Приглашайте
              участников и разграничивайте права — кто редактирует треки, кто
              только смотрит.
            </p>
            {!isLoggedIn && (
              <Link href="/register" className="mt-4 inline-block">
                <Button variant="accent" size="sm">
                  Зарегистрироваться
                </Button>
              </Link>
            )}
          </div>

          <div className="rounded-xl border border-border bg-bg-2 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green/15 text-green">
              <Mic2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium">Заказчикам и площадкам</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Смотрите каталог групп: описание, жанр, город, репертуар и
              техрайдер — без звонков «а пришлите райдер ещё раз». Связь через
              контакты в профиле группы.
            </p>
            <Link href="#catalog" className="mt-4 inline-block">
              <Button variant="default" size="sm">
                Перейти в каталог
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

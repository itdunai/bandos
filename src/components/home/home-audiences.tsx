import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mic2, Music } from "lucide-react";
import type { ReactNode } from "react";

export function HomeAudiences({ ctaSlot }: { ctaSlot: ReactNode }) {
  return (
    <section className="pb-20 sm:pb-28">
      <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 md:grid-cols-2">
        <div className="rounded-md border border-border bg-bg-2 p-7">
          <Music aria-hidden className="mb-5 h-7 w-7 text-accent" />
          <h2 className="heading-poster text-2xl">Музыкантам</h2>
          <p className="mt-3 leading-relaxed text-text-secondary">
            Все материалы в одном месте, подготовка к репетициям и выступлениям,
            сет-лист на сцене у каждого. Приглашайте участников и раздавайте
            права — кто редактирует треки, кто только смотрит.
          </p>
          {ctaSlot}
        </div>
        <div className="rounded-md border border-border bg-bg-2 p-7">
          <Mic2 aria-hidden className="mb-5 h-7 w-7 text-amber" />
          <h2 className="heading-poster text-2xl">Заказчикам</h2>
          <p className="mt-3 leading-relaxed text-text-secondary">
            Каталог групп с описанием, жанром, городом, репертуаром и
            техрайдером — без звонков «а пришлите райдер ещё раз». Заявку на
            выступление можно отправить прямо со страницы группы.
          </p>
          <Link href="#catalog" className="mt-4 inline-block">
            <Button variant="default" size="sm">
              Перейти в каталог
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

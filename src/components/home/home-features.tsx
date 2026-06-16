import {
  Calendar,
  Globe,
  ListMusic,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";

const FEATURES = [
  {
    icon: ListMusic,
    title: "Репертуар и сет-листы",
    description:
      "Треки с BPM, тональностью, аккордами и табами. Собирайте программу концерта drag-and-drop.",
  },
  {
    icon: Smartphone,
    title: "Режим «Играем»",
    description:
      "На сцене — только нужный материал по инструменту. Работает с телефона, можно добавить на главный экран.",
  },
  {
    icon: Calendar,
    title: "График и дела",
    description:
      "Репетиции, концерты, гонорары. Список задач группы — кто что делает, ничего не теряется.",
  },
  {
    icon: Wallet,
    title: "Финансы",
    description:
      "Баланс, доходы и расходы. Гонорар с концерта можно сразу учесть в кассе группы.",
  },
  {
    icon: Users,
    title: "Участники и права",
    description:
      "Приглашения по ссылке, роли от музыканта до администратора. Каждый видит только своё.",
  },
  {
    icon: Globe,
    title: "Публичная страница",
    description:
      "Профиль, репертуар и техрайдер для заказчиков — одна ссылка, без регистрации для просмотра.",
  },
] as const;

export function HomeFeatures() {
  return (
    <section className="border-b border-border bg-bg-2/50 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-xl">
          <h2 className="text-2xl font-medium sm:text-3xl">
            Что умеет BandOS
          </h2>
          <p className="mt-2 text-sm text-text-secondary sm:text-base">
            Замена разрозненным чатам, Google-таблицам и папкам на диске —
            единая база, к которой есть доступ у всей группы.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-bg p-4 transition-colors hover:border-accent/40"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-medium">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

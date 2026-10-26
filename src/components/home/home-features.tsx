import { cn } from "@/lib/utils";
import {
  Calendar,
  Globe,
  ListMusic,
  Play,
  Send,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const FEATURES: {
  id?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  isNew?: boolean;
}[] = [
  {
    icon: ListMusic,
    title: "Репертуар и сет-листы",
    description:
      "Треки с BPM, тональностью, аккордами, табами и текстами. Сет-лист собирается перетаскиванием, длительность считается сама.",
  },
  {
    icon: Play,
    title: "Режим «Играем»",
    description:
      "На сцене каждый видит своё: аккорды, табы или текст. Работает без интернета, экран не гаснет.",
  },
  {
    icon: Calendar,
    title: "График и дела",
    description:
      "Репетиции и концерты с обратным отсчётом, список задач группы — кто что делает и к какому сроку.",
  },
  {
    id: "telegram",
    icon: Send,
    title: "Уведомления в Telegram",
    description:
      "Бот напомнит о репетиции и концерте за сутки, о сроке по делу — и сразу пришлёт новую заявку от заказчика.",
    isNew: true,
  },
  {
    icon: Wallet,
    title: "Касса группы",
    description:
      "Гонорары, аренда и расходы — баланс и график по месяцам. Гонорар с концерта учитывается в один клик.",
  },
  {
    icon: Users,
    title: "Участники и права",
    description:
      "Приглашение по ссылке и роли: кто правит репертуар, кто ведёт график и финансы, кто только играет.",
  },
  {
    icon: Globe,
    title: "Публичная страница",
    description:
      "Описание, репертуар, техрайдер и кнопка «Заказать выступление» — одна ссылка для заказчика.",
  },
];

export function HomeFeatures() {
  return (
    <section id="features" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="heading-poster text-[34px] leading-[0.92] sm:text-6xl">
            Всё, что
            <br />
            нужно группе
          </h2>
          <p className="max-w-sm text-text-secondary">
            Вместо чатов, Google-таблиц и папок на диске — одна база, к которой
            есть доступ у всей группы.
          </p>
        </div>

        <ol className="border-t border-border">
          {FEATURES.map(({ id, icon: Icon, title, description, isNew }, i) => (
            <li
              key={title}
              id={id}
              className={cn(
                "grid scroll-mt-24 grid-cols-[40px_minmax(0,1fr)] gap-x-4 gap-y-2 border-b border-border py-6 transition-colors sm:grid-cols-[80px_minmax(0,1.1fr)_minmax(0,1.4fr)_32px] sm:items-center sm:gap-6 sm:py-7",
                "hover:bg-[linear-gradient(90deg,color-mix(in_srgb,var(--accent)_8%,transparent),transparent)]"
              )}
            >
              <span className="font-display text-lg font-extrabold text-text-muted sm:text-[22px]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="heading-poster flex flex-wrap items-center gap-2 text-lg sm:text-2xl">
                {title}
                {isNew && (
                  <span className="rounded-sm bg-accent px-2 py-0.5 font-sans text-[11px] font-bold tracking-wide text-accent-ink">
                    Новое
                  </span>
                )}
              </h3>
              <p className="col-start-2 leading-relaxed text-text-secondary sm:col-start-auto">
                {description}
              </p>
              <Icon aria-hidden className="hidden h-6 w-6 text-accent sm:block" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

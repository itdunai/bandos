import { Check, Clock, Guitar, MapPin, Play } from "lucide-react";
import type { ReactNode } from "react";

const PREVIEW_SETLIST = [
  ["01", "Полночь", "Em", "4:12"],
  ["02", "Северный ветер", "Am", "3:48"],
  ["03", "Night Drive", "F#m", "4:30"],
  ["04", "Группа крови", "Am", "4:46"],
] as const;

/** Превью продукта: карточка концерта и сет-лист в стиле «Обзора». */
function ProductPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md select-none lg:max-w-none">
      <div className="rounded-xl bg-[linear-gradient(135deg,var(--accent)_0%,var(--accent-dark)_100%)] p-5 text-accent-ink shadow-2xl shadow-accent/20 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-6xl font-extrabold leading-none tracking-tight">30</span>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">окт · пт</span>
          </div>
          <div className="text-right">
            <div className="font-display text-xl font-bold leading-none">4д 02ч</div>
            <div className="mt-1 text-xs opacity-75">до начала</div>
          </div>
        </div>
        <div className="mt-4 text-sm font-semibold">Выступление · через 4 дня</div>
        <div className="heading-poster mt-1.5 text-2xl">Клуб «Б2» — Live</div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-85">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            20:00 — 23:00
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            Б. Садовая, 8
          </span>
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent-ink px-3.5 py-2 text-sm font-semibold text-accent">
          <Play className="h-3.5 w-3.5 fill-current" />
          Открыть сет
        </div>
      </div>

      <div className="relative -mt-2 ml-6 rounded-xl border border-border bg-bg-2 p-4 shadow-xl sm:ml-10">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wide">Сет-лист</span>
          <span className="font-display text-xs font-semibold tabular-nums">48:04</span>
        </div>
        <ol className="space-y-1">
          {PREVIEW_SETLIST.map(([n, title, key, dur]) => (
            <li key={n} className="grid grid-cols-[24px_1fr_36px_40px] items-center gap-2 text-sm">
              <span className="font-display text-xs text-text-muted">{n}</span>
              <span className="truncate font-medium">{title}</span>
              <span className="text-right text-xs text-text-secondary">{key}</span>
              <span className="text-right text-xs tabular-nums text-text-secondary">{dur}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function HomeHero({ ctaSlot }: { ctaSlot: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_0%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:py-24">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-sm border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            <Guitar className="h-3.5 w-3.5" />
            Для кавер- и авторских групп
          </p>
          <h1 className="heading-poster text-[34px] sm:text-5xl lg:text-[56px]">
            Всё для музыкальной группы — в&nbsp;одном месте
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
            Репертуар с аккордами и текстами, сет-листы, режим «Играем» на сцене,
            график репетиций и концертов, касса группы и публичная страница
            с техрайдером для заказчиков.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {ctaSlot}
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary">
            {["Бесплатно", "Работает с телефона", "Без установки"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}

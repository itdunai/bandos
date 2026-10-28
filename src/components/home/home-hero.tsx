import { Send } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const TICKET_SETLIST = [
  ["01", "Полночь", "Em · 4:12"],
  ["02", "Северный ветер", "Am · 3:48"],
  ["03", "Night Drive", "F#m · 4:30"],
  ["04", "Группа крови", "Am · 4:46"],
] as const;

/** «Билет» на концерт с сет-листом — превью продукта. */
function Ticket() {
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-[330px] rotate-[3deg] select-none overflow-hidden rounded-md border border-border bg-bg-2 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.55)] lg:absolute lg:right-6 lg:top-36 lg:mx-0 lg:w-[320px] xl:right-0"
    >
      <div className="bg-[linear-gradient(135deg,var(--accent)_0%,var(--accent-dark)_100%)] p-5 text-accent-ink">
        <div className="font-display text-[68px] font-black leading-[0.85]">30</div>
        <div className="mt-2 text-xs font-bold uppercase tracking-[0.16em] opacity-75">
          октября · пятница · 20:00
        </div>
        <div className="heading-poster mt-3 text-[22px]">Клуб «Б2» — Live</div>
      </div>
      {/* перфорация билета */}
      <div className="relative border-t-2 border-dashed border-border">
        <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-bg" />
        <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-bg" />
      </div>
      <ol className="px-5 pb-5 pt-4">
        {TICKET_SETLIST.map(([n, title, meta]) => (
          <li key={n} className="flex justify-between gap-3 py-1 text-sm text-text-secondary">
            <span className="truncate font-semibold text-text-primary">
              {n} {title}
            </span>
            <span className="shrink-0 tabular-nums">{meta}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HomeHero({ ctaSlot }: { ctaSlot: ReactNode }) {
  return (
    <section className="relative overflow-hidden">
      {/* лучи прожектора */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-[6%] h-[900px] w-[620px] bg-[conic-gradient(from_180deg_at_50%_0%,transparent_160deg,color-mix(in_srgb,var(--accent)_24%,transparent)_175deg,color-mix(in_srgb,var(--amber)_16%,transparent)_180deg,color-mix(in_srgb,var(--accent)_24%,transparent)_185deg,transparent_200deg)] blur-md"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-52 left-1/2 h-[400px] w-[1100px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--accent-dark)_35%,transparent),transparent_65%)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6 sm:pt-14 lg:min-h-[620px] lg:pb-20">
        <Link
          href="#telegram"
          className="mb-8 inline-flex max-w-full items-center gap-2.5 rounded-2xl border border-border bg-bg-2/80 py-1.5 pl-1.5 pr-4 text-sm text-text-secondary backdrop-blur transition-colors hover:border-accent sm:rounded-full sm:py-1 sm:pl-1"
        >
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-accent-ink">
            <Send className="h-3 w-3" />
            Новое
          </span>
          <span className="leading-snug">Напоминания и заявки в Telegram</span>
        </Link>

        <h1 className="flex items-center gap-2.5 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-amber sm:text-[13px]">
          <span
            aria-hidden
            className="h-2 w-2 shrink-0 rounded-full bg-amber shadow-[0_0_0_6px_color-mix(in_srgb,var(--amber)_18%,transparent)]"
          />
          BandOS — приложение для музыкальной группы
        </h1>

        <p
          aria-hidden
          className="heading-poster mb-7 mt-6 max-w-[720px] text-[40px] font-black leading-[0.88] sm:text-7xl lg:text-[96px]"
        >
          Репетиция.
          <br />
          <span className="text-transparent [-webkit-text-stroke:2px_var(--text-primary)]">
            Сет-лист.
          </span>
          <br />
          <span className="text-accent">Концерт.</span>
        </p>

        <p className="max-w-[540px] text-base leading-relaxed text-text-secondary sm:text-lg">
          Репертуар с аккордами и текстами, сет-листы, режим «Играем» на сцене,
          график репетиций и концертов, касса группы и страница с техрайдером
          для заказчиков. Для кавер- и авторских групп — бесплатно.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">{ctaSlot}</div>

        <div className="mt-12 lg:mt-0">
          <Ticket />
        </div>
      </div>
    </section>
  );
}

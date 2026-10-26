import Link from "next/link";
import { ArrowRight, Music } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CatalogBand {
  name: string;
  slug: string;
  description: string | null;
  genre: string | null;
  city: string | null;
  tracks_count: number;
  members_count: number;
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/** Три стиля афиш по кругу: фиолетовая, янтарная, контурная. */
const POSTER_STYLES = [
  {
    card: "bg-[linear-gradient(160deg,var(--accent)_0%,var(--accent-dark)_100%)] text-accent-ink border-transparent",
    title: "",
  },
  {
    card: "bg-[linear-gradient(160deg,#ffb547_0%,#e2702c_100%)] text-[#1a0d02] border-transparent",
    title: "",
  },
  {
    card: "bg-bg-2 text-text-primary border-border",
    title: "text-transparent [-webkit-text-stroke:1.5px_var(--text-primary)]",
  },
];

export function HomeCatalog({
  catalog,
  userBandsSlot,
}: {
  catalog: CatalogBand[];
  userBandsSlot: ReactNode;
}) {
  return (
    <section id="catalog" className="scroll-mt-16 pb-20 sm:pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {userBandsSlot}

        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="heading-poster text-[34px] leading-[0.92] sm:text-6xl">
            Каталог
            <br />
            групп
          </h2>
          <p className="max-w-sm text-text-secondary">
            Кавер- и авторские группы с открытой страницей: жанр, город,
            репертуар, техрайдер и заявка на выступление.
          </p>
        </div>

        {catalog.length === 0 ? (
          <div className="rounded-md border border-dashed border-border-strong p-10 text-center">
            <Music className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-text-secondary">Пока нет групп с публичной страницей.</p>
            <p className="mt-2 text-sm text-text-muted">
              Вы музыкант?{" "}
              <Link href="/register" className="text-accent hover:underline">
                Зарегистрируйтесь
              </Link>{" "}
              и включите публичную страницу группы — она появится здесь.
            </p>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((band, i) => {
              const style = POSTER_STYLES[i % POSTER_STYLES.length];
              return (
                <li key={band.slug}>
                  <Link
                    href={`/rider/${band.slug}`}
                    className={cn(
                      "group relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-md border p-6 transition-transform hover:-translate-y-1 sm:aspect-[3/4]",
                      style.card
                    )}
                  >
                    {/* лёгкие «полосы печати» */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0_2px,transparent_2px_4px)]"
                    />
                    <span className="relative text-xs font-bold uppercase tracking-[0.16em] opacity-75">
                      {[band.genre, band.city].filter(Boolean).join(" · ") || "Группа"}
                    </span>
                    <h3
                      className={cn(
                        "heading-poster relative text-[clamp(26px,3vw,38px)] leading-[0.92] [overflow-wrap:anywhere]",
                        style.title
                      )}
                    >
                      {band.name}
                    </h3>
                    <div className="relative flex items-end justify-between gap-3 text-sm font-semibold">
                      <span>
                        {band.tracks_count} {plural(band.tracks_count, "трек", "трека", "треков")} ·{" "}
                        {band.members_count}{" "}
                        {plural(band.members_count, "участник", "участника", "участников")}
                      </span>
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black/20 transition-transform group-hover:translate-x-1">
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

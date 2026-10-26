import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ArrowRight, MapPin, Music, Users } from "lucide-react";
import type { ReactNode } from "react";

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

export function HomeCatalog({
  catalog,
  userBandsSlot,
}: {
  catalog: CatalogBand[];
  userBandsSlot: ReactNode;
}) {
  return (
    <section id="catalog" className="scroll-mt-16 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {userBandsSlot}

        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="heading-poster text-2xl sm:text-3xl">Каталог групп</h2>
            <p className="mt-2 max-w-xl text-sm text-text-secondary">
              Кавер- и авторские группы с открытой страницей: жанр, город, репертуар,
              техрайдер и контакты для заказа выступления.
            </p>
          </div>
        </div>

        {catalog.length === 0 ? (
          <Card className="p-10 text-center">
            <Music className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">
              Пока нет групп с публичным профилем или репертуаром.
            </p>
            <p className="mt-3 text-xs text-text-muted">
              Вы музыкант?{" "}
              <Link href="/register" className="text-accent hover:underline">
                Зарегистрируйтесь
              </Link>{" "}
              и создайте первую группу — она появится здесь, когда включите
              публичную страницу.
            </p>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((band) => (
              <li key={band.slug}>
                <Link
                  href={`/rider/${band.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-border bg-bg-2 p-5 transition-colors hover:border-accent"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent font-display text-sm font-bold text-accent-ink"
                    >
                      {band.name
                        .split(/\s+/)
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-sans text-lg font-semibold leading-snug group-hover:text-accent">
                        {band.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                        {band.genre && <span className="text-accent">{band.genre}</span>}
                        {band.city && (
                          <span className="flex items-center gap-1 text-text-muted">
                            <MapPin className="h-3 w-3" />
                            {band.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {band.description && (
                    <p className="mb-4 line-clamp-3 text-sm text-text-secondary">{band.description}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-text-muted">
                    <span className="flex gap-3">
                      <span className="flex items-center gap-1">
                        <Music className="h-3 w-3" />
                        {band.tracks_count} {plural(band.tracks_count, "трек", "трека", "треков")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {band.members_count} {plural(band.members_count, "участник", "участника", "участников")}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-accent">
                      Профиль
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

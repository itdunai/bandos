import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Music, Users } from "lucide-react";
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
            <h2 className="text-2xl font-medium sm:text-3xl">Каталог групп</h2>
            <p className="mt-2 max-w-xl text-sm text-text-secondary">
              Коллективы с открытым профилем или репертуаром. Нажмите на карточку,
              чтобы посмотреть детали и связаться.
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((band) => (
              <Card
                key={band.slug}
                className="flex flex-col p-5 transition-colors hover:border-accent/50"
              >
                <div className="mb-2">
                  <h3 className="text-lg font-medium leading-snug">
                    {band.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                    {band.genre && (
                      <span className="text-accent">{band.genre}</span>
                    )}
                    {band.city && (
                      <span className="flex items-center gap-1 text-text-muted">
                        <MapPin className="h-3 w-3" />
                        {band.city}
                      </span>
                    )}
                  </div>
                </div>
                {band.description && (
                  <p className="mb-4 line-clamp-3 text-sm text-text-secondary">
                    {band.description}
                  </p>
                )}
                <div className="mb-4 flex flex-wrap gap-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Music className="h-3 w-3" />
                    {band.tracks_count} треков
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {band.members_count} участников
                  </span>
                </div>
                <div className="mt-auto">
                  <Link href={`/rider/${band.slug}`}>
                    <Button variant="default" size="sm">
                      Открыть профиль
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

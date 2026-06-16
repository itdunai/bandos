import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getUserBands } from "@/lib/band/queries";
import { bandPath } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import { Guitar, LogIn, Music, Plus, Users } from "lucide-react";

interface CatalogBand {
  name: string;
  slug: string;
  description: string | null;
  genre: string | null;
  city: string | null;
  tracks_count: number;
  members_count: number;
  rider_public: boolean;
  repertoire_public: boolean;
}

export default async function HomePage() {
  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseConfigured) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
        <Guitar className="h-12 w-12 text-accent" />
        <h1 className="text-2xl font-medium">BandOS</h1>
        <p className="max-w-md text-sm text-text-secondary">
          Скопируйте <code className="text-accent">.env.local.example</code> в{" "}
          <code className="text-accent">.env.local</code> и укажите ключи Supabase.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: catalogData, error: catalogError }, userBands] =
    await Promise.all([
      supabase.rpc("get_public_bands_catalog"),
      user ? getUserBands() : Promise.resolve([]),
    ]);

  const catalog = catalogError
    ? []
    : ((catalogData ?? []) as CatalogBand[]);

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-bg-2">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-dark">
              <Guitar className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium">BandOS</div>
              <div className="text-[11px] text-text-muted">
                Каталог групп
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {user ? (
              <>
                {userBands.length > 0 && (
                  <Link href={bandPath(userBands[0].slug)}>
                    <Button variant="default" size="sm">
                      В ЛК
                    </Button>
                  </Link>
                )}
                <Link href="/new-band">
                  <Button variant="accent" size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    Создать группу
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/login">
                <Button variant="default" size="sm">
                  <LogIn className="h-3.5 w-3.5" />
                  Войти
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-medium">Выберите группу</h1>
          <p className="mt-2 max-w-xl text-sm text-text-secondary">
            Публичные профили, репертуар и техрайдеры музыкальных коллективов.
            Для заказа выступления свяжитесь с группой через контакты в профиле.
          </p>
        </div>

        {userBands.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-xs uppercase tracking-wider text-text-muted">
              Мои группы
            </h2>
            <div className="flex flex-wrap gap-2">
              {userBands.map((band) => (
                <Link key={band.id} href={bandPath(band.slug)}>
                  <Button variant="default" size="sm">
                    {band.name}
                  </Button>
                </Link>
              ))}
              <Link href="/new-band">
                <Button variant="accent" size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Новая группа
                </Button>
              </Link>
            </div>
          </section>
        )}

        {catalog.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-text-secondary">
              Пока нет групп с публичным профилем или репертуаром.
            </p>
            {!user && (
              <p className="mt-2 text-xs text-text-muted">
                Вы музыкант?{" "}
                <Link href="/register" className="text-accent hover:underline">
                  Зарегистрируйтесь
                </Link>{" "}
                и создайте группу.
              </p>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {catalog.map((band) => (
              <Card
                key={band.slug}
                className="flex flex-col p-5 transition-colors hover:border-accent/50"
              >
                <div className="mb-2">
                  <h3 className="text-lg font-medium">{band.name}</h3>
                  {band.genre && (
                    <p className="text-xs text-accent">{band.genre}</p>
                  )}
                  {band.city && (
                    <p className="text-xs text-text-muted">{band.city}</p>
                  )}
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
      </main>
    </div>
  );
}

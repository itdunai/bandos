import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { getUserBands } from "@/lib/band/queries";
import { bandPath } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Plus } from "lucide-react";
import { HomeHeader } from "./home-header";

async function HomeHeaderAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userBands = user ? await getUserBands() : [];

  return (
    <HomeHeader user={!!user} firstBandSlug={userBands[0]?.slug} />
  );
}

export function HomeHeaderSlot() {
  return (
    <Suspense
      fallback={<HomeHeader user={false} />}
    >
      <HomeHeaderAuth />
    </Suspense>
  );
}

async function HomeHeroCtaAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <Link href="/new-band">
        <Button variant="accent" size="lg">
          Создать группу
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Link href="/register">
        <Button variant="accent" size="lg">
          Создать группу бесплатно
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
      <Link href="/login">
        <Button variant="default" size="lg">
          Уже есть аккаунт
        </Button>
      </Link>
    </>
  );
}

export function HomeHeroCtaSlot() {
  return (
    <Suspense
      fallback={
        <Link href="/register">
          <Button variant="accent" size="lg">
            Создать группу бесплатно
          </Button>
        </Link>
      }
    >
      <HomeHeroCtaAuth />
    </Suspense>
  );
}

async function HomeAudiencesCtaAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return null;

  return (
    <Link href="/register" className="mt-4 inline-block">
      <Button variant="accent" size="sm">
        Зарегистрироваться
      </Button>
    </Link>
  );
}

export function HomeAudiencesCtaSlot() {
  return (
    <Suspense fallback={null}>
      <HomeAudiencesCtaAuth />
    </Suspense>
  );
}

async function HomeUserBandsAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const userBands = await getUserBands();
  if (userBands.length === 0) return null;

  return (
    <div className="mb-10 rounded-xl border border-accent/30 bg-accent/5 p-4 sm:p-5">
      <h2 className="text-sm font-medium">Мои группы</h2>
      <p className="mt-1 text-xs text-text-secondary">
        Быстрый переход в личный кабинет
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
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
    </div>
  );
}

export function HomeUserBandsSlot() {
  return (
    <Suspense fallback={null}>
      <HomeUserBandsAuth />
    </Suspense>
  );
}

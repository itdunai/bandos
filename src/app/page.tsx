import { HomeAudiences } from "@/components/home/home-audiences";
import { HomeCatalog } from "@/components/home/home-catalog";
import {
  HomeAudiencesCtaSlot,
  HomeHeaderSlot,
  HomeHeroCtaSlot,
  HomeUserBandsSlot,
} from "@/components/home/home-dynamic";
import { HomeFeatures } from "@/components/home/home-features";
import { HomeFooter } from "@/components/home/home-footer";
import { HomeHero } from "@/components/home/home-hero";
import { getPublicBandsCatalog } from "@/lib/public-cache";
import { Guitar } from "lucide-react";

export const revalidate = 60;

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

  const catalog = await getPublicBandsCatalog();

  return (
    <div className="min-h-screen bg-bg">
      <HomeHeaderSlot />
      <main>
        <HomeHero ctaSlot={<HomeHeroCtaSlot />} />
        <HomeFeatures />
        <HomeAudiences ctaSlot={<HomeAudiencesCtaSlot />} />
        <HomeCatalog catalog={catalog} userBandsSlot={<HomeUserBandsSlot />} />
      </main>
      <HomeFooter />
    </div>
  );
}

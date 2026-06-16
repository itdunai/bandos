import { HomeAudiences } from "@/components/home/home-audiences";
import { HomeCatalog } from "@/components/home/home-catalog";
import { HomeFeatures } from "@/components/home/home-features";
import { HomeFooter } from "@/components/home/home-footer";
import { HomeHeader } from "@/components/home/home-header";
import { HomeHero } from "@/components/home/home-hero";
import { getUserBands } from "@/lib/band/queries";
import { createClient } from "@/lib/supabase/server";
import { Guitar } from "lucide-react";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: catalogData, error: catalogError }, userBands] =
    await Promise.all([
      supabase.rpc("get_public_bands_catalog"),
      user ? getUserBands() : Promise.resolve([]),
    ]);

  const catalog = catalogError ? [] : (catalogData ?? []);

  return (
    <div className="min-h-screen bg-bg">
      <HomeHeader
        user={!!user}
        firstBandSlug={userBands[0]?.slug}
      />
      <main>
        <HomeHero isLoggedIn={!!user} />
        <HomeFeatures />
        <HomeAudiences isLoggedIn={!!user} />
        <HomeCatalog
          catalog={catalog}
          userBands={userBands}
          isLoggedIn={!!user}
        />
      </main>
      <HomeFooter />
    </div>
  );
}

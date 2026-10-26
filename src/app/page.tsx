import { HomeAudiences } from "@/components/home/home-audiences";
import { HomeCatalog } from "@/components/home/home-catalog";
import {
  HomeAudiencesCtaSlot,
  HomeHeaderSlot,
  HomeHeroCtaSlot,
  HomeUserBandsSlot,
} from "@/components/home/home-dynamic";
import { HomeCta } from "@/components/home/home-cta";
import { HomeFaq } from "@/components/home/home-faq";
import { HomeFeatures } from "@/components/home/home-features";
import { HomeSteps } from "@/components/home/home-steps";
import { HomeFooter } from "@/components/home/home-footer";
import { HomeHero } from "@/components/home/home-hero";
import { SiteLogo } from "@/components/brand/site-logo";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublicBandsCatalog } from "@/lib/public-cache";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "BandOS — приложение для музыкальной группы: сет-листы, репертуар, график" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const SITE_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    inLanguage: "ru",
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon.svg"),
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    applicationCategory: "MusicApplication",
    operatingSystem: "Web, iOS, Android",
    description: SITE_DESCRIPTION,
    offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
  },
];

export default async function HomePage() {
  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseConfigured) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
        <SiteLogo className="h-16" />
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
      <JsonLd data={SITE_JSON_LD} />
      <HomeHeaderSlot />
      <main>
        <HomeHero ctaSlot={<HomeHeroCtaSlot />} />
        <HomeFeatures />
        <HomeSteps />
        <HomeAudiences ctaSlot={<HomeAudiencesCtaSlot />} />
        <HomeCatalog catalog={catalog} userBandsSlot={<HomeUserBandsSlot />} />
        <HomeFaq />
        <HomeCta ctaSlot={<HomeHeroCtaSlot />} />
      </main>
      <HomeFooter />
    </div>
  );
}

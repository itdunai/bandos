import { unstable_cache } from "next/cache";
import type { CatalogBand } from "@/components/home/home-catalog";
import type { PublicBandPageData } from "@/components/band/public-band-page";
import { createPublicSupabaseClient } from "@/lib/supabase/public-server";

export const PUBLIC_PAGE_REVALIDATE_SECONDS = 60;

export const PUBLIC_CATALOG_TAG = "public-catalog";

export function publicBandTag(slug: string) {
  return `public-band:${slug}`;
}

async function fetchPublicBandsCatalog(): Promise<CatalogBand[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase.rpc("get_public_bands_catalog");
  if (error || !data) return [];
  return data as CatalogBand[];
}

async function fetchPublicBandPage(
  bandSlug: string
): Promise<PublicBandPageData | null> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase.rpc("get_public_band_page", {
    p_slug: bandSlug,
  });
  if (error || !data) return null;
  return data as PublicBandPageData;
}

export const getPublicBandsCatalog = unstable_cache(
  fetchPublicBandsCatalog,
  ["public-bands-catalog"],
  {
    revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
    tags: [PUBLIC_CATALOG_TAG],
  }
);

export function getCachedPublicBandPage(bandSlug: string) {
  return unstable_cache(
    () => fetchPublicBandPage(bandSlug),
    ["public-band-page", bandSlug],
    {
      revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
      tags: [publicBandTag(bandSlug), PUBLIC_CATALOG_TAG],
    }
  )();
}

import { getCachedPublicBandPage } from "@/lib/public-cache";
import type { PublicBandPageData } from "@/components/band/public-band-page";

export async function getPublicBandPage(
  bandSlug: string
): Promise<PublicBandPageData | null> {
  return getCachedPublicBandPage(bandSlug);
}

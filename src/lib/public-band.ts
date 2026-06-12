import { createClient } from "@/lib/supabase/server";
import type { PublicBandPageData } from "@/components/band/public-band-page";

export async function getPublicBandPage(
  bandSlug: string
): Promise<PublicBandPageData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_band_page", {
    p_slug: bandSlug,
  });
  if (error || !data) return null;
  return data as PublicBandPageData;
}

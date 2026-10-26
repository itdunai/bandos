import type { MetadataRoute } from "next";
import { getPublicBandsCatalog } from "@/lib/public-cache";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const bands = await getPublicBandsCatalog().catch(() => []);

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/register"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    ...bands.map((band) => ({
      url: absoluteUrl(`/rider/${band.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

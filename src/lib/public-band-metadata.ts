import type { Metadata } from "next";
import { getPublicBandPage } from "@/lib/public-band";
import { bandPageDescription, bandPageTitle, DEFAULT_OG_IMAGE } from "@/lib/seo";

/** Метаданные публичной страницы группы. Canonical — всегда /rider/<slug>. */
export async function publicBandMetadata(bandSlug: string): Promise<Metadata> {
  const band = await getPublicBandPage(bandSlug);
  if (!band) {
    return { title: "Группа не найдена", robots: { index: false, follow: true } };
  }

  const title = bandPageTitle(band);
  const description = bandPageDescription(band);
  const path = `/rider/${band.slug}`;
  const photo = band.logo_url ?? (Array.isArray(band.photos) ? band.photos[0] : null);
  const images = photo ? [{ url: photo, alt: band.name }] : [DEFAULT_OG_IMAGE];

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "profile",
      url: path,
      title,
      description,
      images,
    },
    twitter: {
      card: photo ? "summary" : "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

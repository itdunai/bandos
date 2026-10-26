import { PublicBandPage } from "@/components/band/public-band-page";
import { getPublicBandPage } from "@/lib/public-band";
import { publicBandMetadata } from "@/lib/public-band-metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

/** Тот же контент, что /rider — для обратной совместимости ссылок */
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bandSlug: string }>;
}): Promise<Metadata> {
  const { bandSlug } = await params;
  return publicBandMetadata(bandSlug);
}

export default async function PublicRepertoirePage({
  params,
}: {
  params: Promise<{ bandSlug: string }>;
}) {
  const { bandSlug } = await params;
  const band = await getPublicBandPage(bandSlug);
  if (!band) notFound();
  return <PublicBandPage band={band} />;
}

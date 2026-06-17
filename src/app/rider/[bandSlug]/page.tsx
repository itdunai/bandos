import { PublicBandPage } from "@/components/band/public-band-page";
import { getPublicBandPage } from "@/lib/public-band";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function PublicBandPageRoute({
  params,
}: {
  params: Promise<{ bandSlug: string }>;
}) {
  const { bandSlug } = await params;
  const band = await getPublicBandPage(bandSlug);
  if (!band) notFound();
  return <PublicBandPage band={band} />;
}

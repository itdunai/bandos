import { PublicBandPage } from "@/components/band/public-band-page";
import { getPublicBandPage } from "@/lib/public-band";
import { notFound } from "next/navigation";

/** Тот же контент, что /rider — для обратной совместимости ссылок */
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

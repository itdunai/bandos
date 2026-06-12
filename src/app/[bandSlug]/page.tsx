import { BandHome } from "@/components/band/band-home";

export default async function BandHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ bandSlug: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { bandSlug } = await params;
  const { edit } = await searchParams;
  return <BandHome bandSlug={bandSlug} edit={edit} />;
}

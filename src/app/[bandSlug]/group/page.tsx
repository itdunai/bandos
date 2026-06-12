import { getBandBySlug } from "@/lib/band/queries";
import { bandPath } from "@/lib/paths";
import { notFound, redirect } from "next/navigation";

export default async function GroupRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ bandSlug: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { bandSlug } = await params;
  const { edit } = await searchParams;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const query = edit === "1" ? "?edit=1" : "";
  redirect(`${bandPath(band.slug)}${query}`);
}

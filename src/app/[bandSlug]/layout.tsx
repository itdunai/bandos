import type { Metadata } from "next";
import { BandShellProvider } from "@/components/layout/band-shell-context";
import {
  getBandBySlug,
  getCurrentMember,
  getUpcomingEvent,
  getUserBands,
} from "@/lib/band/queries";
import { redirectForbidden } from "@/lib/forbidden";
import { isReservedBandSlug } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bandSlug: string }>;
}): Promise<Metadata> {
  const { bandSlug } = await params;
  const band = isReservedBandSlug(bandSlug) ? null : await getBandBySlug(bandSlug);
  return {
    title: band ? { default: band.name, template: `%s · ${band.name}` } : "Группа",
    robots: { index: false, follow: false },
  };
}

export default async function BandLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ bandSlug: string }>;
}) {
  const { bandSlug } = await params;

  if (isReservedBandSlug(bandSlug)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [band, userBands] = await Promise.all([
    getBandBySlug(bandSlug),
    getUserBands(),
  ]);
  if (!band) notFound();

  const [member, upcoming] = await Promise.all([
    getCurrentMember(band.id),
    getUpcomingEvent(band.id),
  ]);
  if (!member) {
    redirectForbidden({ reason: "not_member", bandSlug });
  }

  return (
    <BandShellProvider userBands={userBands} upcomingEvent={upcoming}>
      {children}
    </BandShellProvider>
  );
}

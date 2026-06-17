import { BandShellProvider } from "@/components/layout/band-shell-context";
import {
  getBandBySlug,
  getCurrentMember,
  getUpcomingEvent,
  getUserBands,
} from "@/lib/band/queries";
import { isReservedBandSlug } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function BandLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ bandSlug: string }>;
}) {
  const { bandSlug } = await params;

  // Старый деплой без app/admin: /admin попадает сюда как slug группы → 404.
  if (isReservedBandSlug(bandSlug)) {
    if (bandSlug.toLowerCase() === "admin") redirect("/platform");
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
    redirect("/");
  }

  return (
    <BandShellProvider userBands={userBands} upcomingEvent={upcoming}>
      {children}
    </BandShellProvider>
  );
}

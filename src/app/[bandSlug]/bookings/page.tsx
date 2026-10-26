import { AppShell } from "@/components/layout/app-shell";
import { BookingList } from "@/components/bookings/booking-list";
import { hasPermission } from "@/lib/band/permissions";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { redirectForbidden } from "@/lib/forbidden";
import { bandPath } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import type { Band, BookingRequest } from "@/types/database";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ bandSlug: string }>;
}) {
  const { bandSlug } = await params;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const [member, memberCount, supabase] = await Promise.all([
    getCurrentMember(band.id),
    getBandMemberCount(band.id),
    createClient(),
  ]);
  if (!member || !hasPermission(member, "band_profile")) {
    redirectForbidden({ reason: "no_permission", permission: "band_profile", bandSlug: band.slug });
  }

  const { data } = await supabase
    .from("booking_requests")
    .select("id, band_id, name, contact, event_date, city, event_format, message, status, created_at")
    .eq("band_id", band.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const bookings = (data ?? []) as BookingRequest[];
  const accepting = (band as Band).accept_bookings ?? false;

  return (
    <AppShell
      band={band}
      member={member}
      memberCount={memberCount}
      title="Заявки"
      subtitle={
        accepting ? (
          <span>
            Приходят с{" "}
            <Link href={`/rider/${band.slug}#booking`} className="text-accent hover:underline">
              публичной страницы
            </Link>
          </span>
        ) : (
          <span>
            Приём заявок выключен — включите его в{" "}
            <Link href={`${bandPath(band.slug, "group")}?edit=1`} className="text-accent hover:underline">
              профиле группы
            </Link>
          </span>
        )
      }
    >
      <BookingList bookings={bookings} bandId={band.id} bandSlug={band.slug} />
    </AppShell>
  );
}

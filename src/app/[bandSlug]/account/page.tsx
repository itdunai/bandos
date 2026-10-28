import { AppShell } from "@/components/layout/app-shell";
import {
  AccountDeleteCard,
  AccountLoginCard,
} from "@/components/account/account-sections";
import { MemberProfileForm } from "@/components/members/member-profile-form";
import {
  TelegramConnectCard,
  type TelegramAccountView,
} from "@/components/telegram/telegram-connect-card";
import { Card } from "@/components/ui/card";
import { getOwnedBands } from "@/lib/account/owned-bands";
import { hasPermission } from "@/lib/band/permissions";
import {
  getBandBySlug,
  getBandMemberCount,
  getCurrentMember,
} from "@/lib/band/queries";
import { createClient } from "@/lib/supabase/server";
import { isTelegramConfigured } from "@/lib/telegram/bot";
import { notFound, redirect } from "next/navigation";

export const metadata = { title: "Аккаунт" };

export default async function BandAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ bandSlug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { bandSlug } = await params;
  const { error } = await searchParams;
  const band = await getBandBySlug(bandSlug);
  if (!band) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const telegramEnabled = isTelegramConfigured();
  const [member, memberCount, ownedBands, profileResult, telegramResult] =
    await Promise.all([
      getCurrentMember(band.id),
      getBandMemberCount(band.id),
      getOwnedBands(supabase, user.id),
      supabase.from("profiles").select("avatar_url").eq("id", user.id).single(),
      telegramEnabled
        ? supabase
            .from("telegram_accounts")
            .select("username, first_name, notify_events, notify_todos, notify_bookings")
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const email = user.email ?? "";

  return (
    <AppShell band={band} member={member} memberCount={memberCount} title="Аккаунт">
      {error && (
        <div className="mb-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {decodeURIComponent(error)}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-5">
          {member && (
            <Card className="p-4 sm:p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide">Мой профиль</h3>
              <p className="mb-3 mt-1 text-xs text-text-muted">
                Имя, инструмент и контакты в группе «{band.name}»
              </p>
              <MemberProfileForm
                member={member}
                bandSlug={band.slug}
                avatarUrl={profileResult.data?.avatar_url ?? null}
              />
            </Card>
          )}

          {telegramEnabled && member && (
            <TelegramConnectCard
              bandSlug={band.slug}
              account={(telegramResult.data as TelegramAccountView | null) ?? null}
              showBookings={hasPermission(member, "band_profile")}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <AccountLoginCard email={email} />
          <AccountDeleteCard email={email} ownedBands={ownedBands} />
        </div>
      </div>
    </AppShell>
  );
}

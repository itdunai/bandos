import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AccountDeleteCard,
  AccountLoginCard,
} from "@/components/account/account-sections";
import { Card, CardTitle } from "@/components/ui/card";
import { getOwnedBands } from "@/lib/account/owned-bands";
import { getUserBands } from "@/lib/band/queries";
import { bandPath } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Аккаунт",
  robots: { index: false, follow: false },
};

/** Аккаунт без группы. Участников групп ведём в аккаунт внутри группы — с меню и профилем. */
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const userBands = await getUserBands();
  if (userBands.length > 0) {
    const query = params.error ? `?error=${encodeURIComponent(params.error)}` : "";
    redirect(`${bandPath(userBands[0].slug, "account")}${query}`);
  }

  const ownedBands = await getOwnedBands(supabase, user.id);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-bold">Аккаунт</h1>

      {params.error && (
        <div className="rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <AccountLoginCard email={user.email ?? ""} />

      <Card className="space-y-2 p-5">
        <CardTitle>Группа</CardTitle>
        <p className="text-sm text-text-secondary">
          Профиль музыканта и уведомления в Telegram появятся, когда вы создадите
          группу или вступите в неё по приглашению.
        </p>
        <Link href="/new-band" className="text-sm text-accent hover:underline">
          Создать группу →
        </Link>
      </Card>

      <AccountDeleteCard email={user.email ?? ""} ownedBands={ownedBands} />
    </div>
  );
}

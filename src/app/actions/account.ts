"use server";

import { getOwnedBands, removeAccountMedia } from "@/lib/account/owned-bands";
import { captureServerError } from "@/lib/monitoring/sentry";
import { logPlatformEvent } from "@/lib/platform/audit";
import { revalidatePublicCatalog } from "@/lib/public-revalidate";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** Удаление собственного аккаунта и созданных им групп. Подтверждение — ввод email. */
export async function deleteAccount(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const confirmEmail = ((formData.get("confirm_email") as string) || "").trim();
  if (confirmEmail.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    redirect(
      `/account?error=${encodeURIComponent("Email не совпадает — аккаунт не удалён")}`
    );
  }

  const owned = await getOwnedBands(supabase, user.id);
  await removeAccountMedia(supabase, user.id, owned.map((b) => b.id));

  // Пишем до удаления: после него user_id в журнале станет NULL (ON DELETE SET NULL)
  await logPlatformEvent({
    level: "info",
    event: "user.account_deleted",
    userId: user.id,
    meta: { bandsDeleted: owned.length },
  });

  const { error } = await supabase.rpc("delete_my_account", {
    p_confirm_email: confirmEmail,
  });

  if (error) {
    captureServerError(new Error(error.message), {
      action: "account.delete",
      userId: user.id,
    });
    redirect(`/account?error=${encodeURIComponent(error.message)}`);
  }

  // Пользователя уже нет — signOut только чистит cookie сессии
  await supabase.auth.signOut().catch(() => undefined);
  if (owned.length) revalidatePublicCatalog();

  redirect("/account/deleted");
}

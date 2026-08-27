"use server";

import { captureServerError } from "@/lib/monitoring/sentry";
import { logPlatformEventAsync } from "@/lib/platform/audit";
import { requirePlatformAdmin } from "@/lib/platform/admin";
import { redirectWithToast } from "@/lib/redirect-with-toast";
import {
  PRIVACY_PAGE_SLUG,
  PRIVACY_PAGE_TAG,
  SITE_PAGE_BODY_MAX,
  SITE_PAGE_TITLE_MAX,
} from "@/lib/legal/site-pages";
import { revalidatePath, revalidateTag } from "next/cache";

export async function updatePrivacyPolicy(formData: FormData) {
  const { supabase, user, hasDbFlag } = await requirePlatformAdmin(
    "/admin/privacy"
  );

  if (!hasDbFlag) {
    await redirectWithToast(
      "/admin/privacy",
      "Сначала выдайте флаг is_platform_admin в БД"
    );
    return;
  }

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const body = (formData.get("body") as string | null)?.trim() ?? "";

  if (!title) {
    await redirectWithToast("/admin/privacy", "Укажите заголовок");
    return;
  }
  if (!body) {
    await redirectWithToast("/admin/privacy", "Текст политики не может быть пустым");
    return;
  }
  if (title.length > SITE_PAGE_TITLE_MAX) {
    await redirectWithToast(
      "/admin/privacy",
      `Заголовок длиннее ${SITE_PAGE_TITLE_MAX} символов`
    );
    return;
  }
  if (body.length > SITE_PAGE_BODY_MAX) {
    await redirectWithToast(
      "/admin/privacy",
      `Текст длиннее ${SITE_PAGE_BODY_MAX} символов`
    );
    return;
  }

  const { error } = await supabase.from("site_pages").upsert(
    {
      slug: PRIVACY_PAGE_SLUG,
      title,
      body,
    },
    { onConflict: "slug" }
  );

  if (error) {
    captureServerError(new Error(error.message), {
      action: "platform.update_privacy_policy",
      userId: user.id,
    });
    await redirectWithToast("/admin/privacy", error.message);
    return;
  }

  logPlatformEventAsync({
    level: "info",
    event: "privacy_policy_updated",
    userId: user.id,
  });

  revalidateTag(PRIVACY_PAGE_TAG, "max");
  revalidatePath("/privacy");
  revalidatePath("/admin/privacy");

  await redirectWithToast("/admin/privacy", "Политика сохранена", "success");
}

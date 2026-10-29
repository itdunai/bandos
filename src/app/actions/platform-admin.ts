"use server";

import { isEmailPlatformAdmin, requirePlatformAdmin } from "@/lib/platform/admin";
import { revalidatePath } from "next/cache";
import { captureServerError } from "@/lib/monitoring/sentry";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { isFeedbackStatus } from "@/lib/feedback/tickets";
import { notifyFeedbackUpdate } from "@/lib/telegram/notify";

/** Синхронизирует is_platform_admin в БД для email из PLATFORM_ADMIN_EMAILS (нужен service role). */
export async function bootstrapPlatformAdmin(): Promise<{ ok: boolean; error?: string }> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!serviceKey || !url) {
    captureServerError(new Error("SUPABASE_SERVICE_ROLE_KEY не задан"), {
      action: "platform.bootstrap_admin",
    });
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY не задан" };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isEmailPlatformAdmin(user.email)) {
    captureServerError(new Error("Нет доступа к bootstrap platform admin"), {
      action: "platform.bootstrap_admin",
      userId: user?.id,
      extras: { email: user?.email ?? null },
    });
    return { ok: false, error: "Нет доступа" };
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await admin
    .from("profiles")
    .update({ is_platform_admin: true })
    .eq("id", user.id);

  if (error) {
    captureServerError(new Error(error.message), {
      action: "platform.bootstrap_admin",
      userId: user.id,
    });
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Статус и ответ на обращение. Автору — уведомление в Telegram (если привязан) и индикатор на сайте. */
export async function updateFeedbackTicket(
  feedbackId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string; notified?: boolean }> {
  const { supabase } = await requirePlatformAdmin("/admin/feedback");

  const status = formData.get("status");
  if (!isFeedbackStatus(status)) return { ok: false, error: "Неизвестный статус" };
  const reply = ((formData.get("admin_reply") as string) || "").trim().slice(0, 4000) || null;
  const notify = formData.get("notify") === "on";

  const { data: before } = await supabase
    .from("feedback")
    .select("status, admin_reply")
    .eq("id", feedbackId)
    .maybeSingle();
  if (!before) return { ok: false, error: "Обращение не найдено" };

  const changed = before.status !== status || (before.admin_reply ?? null) !== reply;
  if (!changed) return { ok: true };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("feedback")
    .update({
      status,
      admin_reply: reply,
      updated_at: now,
      ...(reply && reply !== before.admin_reply ? { replied_at: now } : {}),
    })
    .eq("id", feedbackId);
  if (error) return { ok: false, error: error.message };

  let notified = false;
  if (notify) {
    try {
      notified = await notifyFeedbackUpdate(feedbackId);
    } catch (e) {
      captureServerError(e, { action: "feedback.notify_update", extras: { feedbackId } });
    }
  }

  revalidatePath("/admin", "layout");
  return { ok: true, notified };
}

/** Сделать копию прямо сейчас и отправить админам в Telegram. */
export async function runBackupNow(): Promise<{ ok: boolean; message: string }> {
  await requirePlatformAdmin("/admin/system");
  const { runTelegramBackup } = await import("@/lib/backup/job");
  const res = await runTelegramBackup("manual");
  revalidatePath("/admin/system");
  return res.ok
    ? { ok: true, message: `Копия ${res.file} отправлена в Telegram` }
    : { ok: false, message: res.error };
}

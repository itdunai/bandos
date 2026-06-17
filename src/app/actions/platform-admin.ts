"use server";

import { isEmailPlatformAdmin } from "@/lib/platform/admin";
import { captureServerError } from "@/lib/monitoring/sentry";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

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

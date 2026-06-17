"use server";

import { isEmailPlatformAdmin } from "@/lib/platform/admin";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

/** Синхронизирует is_platform_admin в БД для email из PLATFORM_ADMIN_EMAILS (нужен service role). */
export async function bootstrapPlatformAdmin(): Promise<{ ok: boolean; error?: string }> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!serviceKey || !url) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY не задан" };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isEmailPlatformAdmin(user.email)) {
    return { ok: false, error: "Нет доступа" };
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await admin
    .from("profiles")
    .update({ is_platform_admin: true })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

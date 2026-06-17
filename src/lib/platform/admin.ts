import { redirectForbidden } from "@/lib/forbidden";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

function platformAdminEmails(): string[] {
  const raw = process.env.PLATFORM_ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return platformAdminEmails().includes(email.toLowerCase());
}

export async function isPlatformAdminUser(user: User): Promise<boolean> {
  if (isEmailPlatformAdmin(user.email)) return true;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.is_platform_admin === true;
}

export async function requirePlatformAdmin(nextPath = "/admin") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const allowed = await isPlatformAdminUser(user);
  if (!allowed) {
    redirectForbidden({ reason: "platform_admin", back: nextPath });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin, display_name")
    .eq("id", user.id)
    .maybeSingle();

  const hasDbFlag = profile?.is_platform_admin === true;

  return {
    supabase,
    user,
    hasDbFlag,
    needsDbPromotion: !hasDbFlag && isEmailPlatformAdmin(user.email),
  };
}

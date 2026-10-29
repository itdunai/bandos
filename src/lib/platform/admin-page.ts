import { requirePlatformAdmin } from "@/lib/platform/admin";

/** Общее для страниц /admin: доступ, версия сборки, число новых обращений для вкладки. */
export async function loadAdminPage(nextPath: string) {
  const access = await requirePlatformAdmin(nextPath);
  const { count } = access.hasDbFlag
    ? await access.supabase
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("status", "new")
    : { count: 0 };

  return {
    ...access,
    buildSha: process.env.BUILD_SHA ?? "dev",
    newFeedback: count ?? 0,
  };
}

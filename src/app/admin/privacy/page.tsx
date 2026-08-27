import { PrivacyPolicyForm } from "@/components/admin/privacy-policy-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { PlatformAdminSetup } from "@/components/admin/platform-admin-setup";
import { getPrivacyPageUncached } from "@/lib/legal/site-pages";
import { requirePlatformAdmin } from "@/lib/platform/admin";

export default async function AdminPrivacyPage() {
  const { supabase, user, hasDbFlag, needsDbPromotion } =
    await requirePlatformAdmin("/admin/privacy");
  const page = await getPrivacyPageUncached(supabase);
  const buildSha = process.env.BUILD_SHA ?? "dev";

  return (
    <AdminShell userEmail={user.email ?? "—"} buildSha={buildSha}>
      {needsDbPromotion && (
        <div className="mb-6">
          <PlatformAdminSetup userEmail={user.email ?? ""} />
        </div>
      )}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium">Политика конфиденциальности</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Текст на{" "}
            <span className="text-text-primary">/privacy</span>. После сохранения
            страница обновится у посетителей.
          </p>
        </div>
        <PrivacyPolicyForm page={page} canSave={hasDbFlag} />
      </div>
    </AdminShell>
  );
}

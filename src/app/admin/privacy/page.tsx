import type { Metadata } from "next";
import { PrivacyPolicyForm } from "@/components/admin/privacy-policy-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { PlatformAdminSetup } from "@/components/admin/platform-admin-setup";
import { getPrivacyPageUncached } from "@/lib/legal/site-pages";
import { loadAdminPage } from "@/lib/platform/admin-page";

export const metadata: Metadata = {
  title: "Политика конфиденциальности — редактирование",
  robots: { index: false, follow: false },
};


export default async function AdminPrivacyPage() {
  const { supabase, user, hasDbFlag, needsDbPromotion, buildSha, newFeedback } =
    await loadAdminPage("/admin/privacy");
  const page = await getPrivacyPageUncached(supabase);

  return (
    <AdminShell
      userEmail={user.email ?? "—"}
      buildSha={buildSha}
      section="privacy"
      newFeedback={newFeedback}
    >
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

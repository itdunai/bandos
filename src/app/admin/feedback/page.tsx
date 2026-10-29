import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { FeedbackList } from "@/components/admin/feedback-list";
import { loadAdminPage } from "@/lib/platform/admin-page";
import { getPlatformFeedback } from "@/lib/platform/queries";

export const metadata: Metadata = {
  title: "Обращения — админка",
  robots: { index: false, follow: false },
};

export default async function AdminFeedbackPage() {
  const { supabase, user, hasDbFlag, buildSha, newFeedback } =
    await loadAdminPage("/admin/feedback");
  const feedback = hasDbFlag ? await getPlatformFeedback(supabase) : [];

  return (
    <AdminShell
      userEmail={user.email ?? "—"}
      buildSha={buildSha}
      section="feedback"
      newFeedback={newFeedback}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium">Обращения</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Статус и ответ видит автор в разделе «Обратная связь». При сохранении можно написать
            ему в Telegram.
          </p>
        </div>
        <FeedbackList items={feedback} />
      </div>
    </AdminShell>
  );
}

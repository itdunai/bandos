import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminShell } from "@/components/admin/admin-shell";
import { PlatformAdminSetup } from "@/components/admin/platform-admin-setup";
import {
  TelegramDiagnostics,
  TelegramDiagnosticsSkeleton,
} from "@/components/admin/telegram-diagnostics";
import { Suspense } from "react";
import { requirePlatformAdmin } from "@/lib/platform/admin";
import {
  checkPlatformHealth,
  getPlatformAuditLog,
  getPlatformFeedback,
  getPlatformStats,
} from "@/lib/platform/queries";
import { FeedbackList } from "@/components/admin/feedback-list";

export async function PlatformAdminPage({ nextPath }: { nextPath: string }) {
  const { supabase, user, hasDbFlag, needsDbPromotion } =
    await requirePlatformAdmin(nextPath);
  const buildSha = process.env.BUILD_SHA ?? "dev";

  const [stats, auditLog, feedback, health] = await Promise.all([
    hasDbFlag ? getPlatformStats(supabase) : Promise.resolve(null),
    hasDbFlag ? getPlatformAuditLog(supabase) : Promise.resolve([]),
    hasDbFlag ? getPlatformFeedback(supabase) : Promise.resolve([]),
    checkPlatformHealth(supabase),
  ]);
  const newFeedback = feedback.filter((f) => f.status === "new").length;

  return (
    <AdminShell userEmail={user.email ?? "—"} buildSha={buildSha}>
      {needsDbPromotion && (
        <div className="mb-6">
          <PlatformAdminSetup userEmail={user.email ?? ""} />
        </div>
      )}
      <AdminDashboard
        stats={stats}
        auditLog={auditLog}
        health={health}
        feedbackSlot={
          <>
            <p className="mb-2 text-xs text-text-secondary">
              Новых: {newFeedback}
            </p>
            <FeedbackList items={feedback} />
          </>
        }
        telegramSlot={
          <Suspense fallback={<TelegramDiagnosticsSkeleton />}>
            <TelegramDiagnostics />
          </Suspense>
        }
      />
    </AdminShell>
  );
}

import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { MetricsOverview } from "@/components/admin/metrics-overview";
import { PlatformAdminSetup } from "@/components/admin/platform-admin-setup";
import { Card } from "@/components/ui/card";
import { loadAdminPage } from "@/lib/platform/admin-page";
import { getPlatformMetrics, METRICS_PERIODS } from "@/lib/platform/metrics";
import { getPlatformStats } from "@/lib/platform/queries";

export const metadata: Metadata = {
  title: "Админка",
  robots: { index: false, follow: false },
};

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: daysParam } = await searchParams;
  const days = METRICS_PERIODS.find((p) => String(p) === daysParam) ?? 30;
  const { supabase, user, hasDbFlag, needsDbPromotion, buildSha, newFeedback } =
    await loadAdminPage("/admin");

  const [metrics, stats] = hasDbFlag
    ? await Promise.all([getPlatformMetrics(supabase, days), getPlatformStats(supabase)])
    : [null, null];

  return (
    <AdminShell
      userEmail={user.email ?? "—"}
      buildSha={buildSha}
      section="overview"
      newFeedback={newFeedback}
    >
      {needsDbPromotion && (
        <div className="mb-6">
          <PlatformAdminSetup userEmail={user.email ?? ""} />
        </div>
      )}
      {metrics ? (
        <MetricsOverview metrics={metrics} stats={stats} days={days} />
      ) : (
        <Card className="p-6 text-sm text-text-secondary">
          {hasDbFlag ? (
            <>
              Метрика появится после миграции{" "}
              <code className="text-accent">031_feedback_tickets_and_metrics.sql</code>.
            </>
          ) : (
            <>
              Нет доступа к метрике — настройте флаг{" "}
              <code className="text-accent">is_platform_admin</code> (см. блок выше).
            </>
          )}
        </Card>
      )}
    </AdminShell>
  );
}

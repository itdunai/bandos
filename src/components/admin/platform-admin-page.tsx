import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminShell } from "@/components/admin/admin-shell";
import { PlatformAdminSetup } from "@/components/admin/platform-admin-setup";
import { requirePlatformAdmin } from "@/lib/platform/admin";
import {
  checkPlatformHealth,
  getPlatformAuditLog,
  getPlatformStats,
} from "@/lib/platform/queries";

export async function PlatformAdminPage({ nextPath }: { nextPath: string }) {
  const { supabase, user, hasDbFlag, needsDbPromotion } =
    await requirePlatformAdmin(nextPath);
  const buildSha = process.env.BUILD_SHA ?? "dev";

  const [stats, auditLog, health] = await Promise.all([
    hasDbFlag ? getPlatformStats(supabase) : Promise.resolve(null),
    hasDbFlag ? getPlatformAuditLog(supabase) : Promise.resolve([]),
    checkPlatformHealth(supabase),
  ]);

  return (
    <AdminShell userEmail={user.email ?? "—"} buildSha={buildSha}>
      {needsDbPromotion && (
        <div className="mb-6">
          <PlatformAdminSetup userEmail={user.email ?? ""} />
        </div>
      )}
      <AdminDashboard stats={stats} auditLog={auditLog} health={health} />
    </AdminShell>
  );
}

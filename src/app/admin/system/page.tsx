import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSectionTitle, AuditLogTable, HealthList } from "@/components/admin/admin-system";
import {
  TelegramDiagnostics,
  TelegramDiagnosticsSkeleton,
} from "@/components/admin/telegram-diagnostics";
import { loadAdminPage } from "@/lib/platform/admin-page";
import { checkPlatformHealth, getPlatformAuditLog } from "@/lib/platform/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Система — админка",
  robots: { index: false, follow: false },
};

export default async function AdminSystemPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { level: levelParam } = await searchParams;
  const level = levelParam === "error" || levelParam === "warn" ? levelParam : undefined;
  const { supabase, user, hasDbFlag, buildSha, newFeedback } =
    await loadAdminPage("/admin/system");

  const [health, auditLog] = await Promise.all([
    checkPlatformHealth(supabase),
    hasDbFlag ? getPlatformAuditLog(supabase, 100, level) : Promise.resolve([]),
  ]);
  const allHealthy = health.every((c) => c.ok);

  return (
    <AdminShell
      userEmail={user.email ?? "—"}
      buildSha={buildSha}
      section="system"
      newFeedback={newFeedback}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-medium">Система</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Здоровье сервиса, Telegram-бот и журнал событий
          </p>
        </div>

        <section>
          <AdminSectionTitle>Здоровье · {allHealthy ? "всё в порядке" : "есть проблемы"}</AdminSectionTitle>
          <HealthList health={health} />
        </section>

        <section>
          <AdminSectionTitle>Telegram-бот</AdminSectionTitle>
          <Suspense fallback={<TelegramDiagnosticsSkeleton />}>
            <TelegramDiagnostics />
          </Suspense>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
              Журнал событий
            </h2>
            <div className="flex gap-1">
              {[
                { value: undefined, label: "Все" },
                { value: "warn", label: "Предупреждения" },
                { value: "error", label: "Ошибки" },
              ].map((f) => (
                <Link
                  key={f.label}
                  href={f.value ? `/admin/system?level=${f.value}` : "/admin/system"}
                  aria-current={level === f.value ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                    level === f.value
                      ? "bg-accent text-accent-ink"
                      : "text-text-secondary hover:bg-bg-3"
                  )}
                >
                  {f.label}
                </Link>
              ))}
            </div>
          </div>
          <AuditLogTable rows={auditLog} hasAccess={hasDbFlag} />
        </section>
      </div>
    </AdminShell>
  );
}

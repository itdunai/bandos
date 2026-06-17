import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { AuditLogRow, PlatformStats } from "@/lib/platform/queries";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export function AdminDashboard({
  stats,
  auditLog,
  health,
}: {
  stats: PlatformStats | null;
  auditLog: AuditLogRow[];
  health: { name: string; ok: boolean; detail?: string }[];
}) {
  const allHealthy = health.every((c) => c.ok);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium">Панель платформы</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Статистика, журнал и здоровье сервиса
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-wider text-text-muted">
          Статистика
        </h2>
        {stats ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Пользователей" value={stats.users} />
            <StatCard label="Групп" value={stats.bands} />
            <StatCard label="Участников" value={stats.active_members} />
            <StatCard label="Треков" value={stats.songs} />
            <StatCard label="Сет-листов" value={stats.setlists} />
            <StatCard label="Публичных групп" value={stats.public_bands} />
            <StatCard
              label="Регистраций за 7 дн."
              value={stats.registrations_7d}
            />
            <StatCard label="Групп за 7 дн." value={stats.bands_7d} />
          </div>
        ) : (
          <Card className="p-4 text-sm text-text-secondary">
            Нет доступа к статистике — настройте флаг{" "}
            <code className="text-accent">is_platform_admin</code> (см. блок выше).
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted">
          <Activity className="h-3.5 w-3.5" />
          Здоровье
        </h2>
        <div className="space-y-2">
          {health.map((check) => (
            <div
              key={check.name}
              className="flex items-start gap-3 rounded-lg border border-border bg-bg-2 px-4 py-3"
            >
              {check.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{check.name}</div>
                {check.detail && (
                  <div className="mt-0.5 text-xs text-text-muted">
                    {check.detail}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-text-muted">
          Общий статус: {allHealthy ? "OK" : "есть проблемы"}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-wider text-text-muted">
          Журнал событий
        </h2>
        {auditLog.length === 0 ? (
          <Card className="p-6 text-center text-sm text-text-secondary">
            {stats
              ? "Пока нет записей — события появятся при регистрациях и ошибках."
              : "Журнал доступен после настройки прав в БД."}
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-2 text-[11px] uppercase tracking-wider text-text-muted">
                  <th className="px-3 py-2 font-medium">Время</th>
                  <th className="px-3 py-2 font-medium">Уровень</th>
                  <th className="px-3 py-2 font-medium">Событие</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">
                    Детали
                  </th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-text-muted">
                      {formatDate(row.created_at, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2">
                      <LevelBadge level={row.level} />
                    </td>
                    <td className="px-3 py-2 font-medium">{row.event}</td>
                    <td className="hidden max-w-xs truncate px-3 py-2 text-xs text-text-secondary sm:table-cell">
                      {formatMeta(row.meta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-[11px] uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className="mt-1 text-2xl font-medium">{value}</div>
    </Card>
  );
}

function LevelBadge({ level }: { level: AuditLogRow["level"] }) {
  const styles = {
    info: "bg-blue/15 text-blue",
    warn: "bg-amber/15 text-amber",
    error: "bg-red/15 text-red",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${styles[level]}`}
    >
      {level}
    </span>
  );
}

function formatMeta(meta: Record<string, unknown>) {
  const keys = Object.keys(meta);
  if (!keys.length) return "—";
  try {
    return JSON.stringify(meta);
  } catch {
    return "—";
  }
}

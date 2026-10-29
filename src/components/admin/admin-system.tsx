import { Card } from "@/components/ui/card";
import type { AuditLogRow } from "@/lib/platform/queries";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { LocalDateTime } from "@/components/ui/local-date-time";

export function AdminSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
      {children}
    </h2>
  );
}

export function HealthList({ health }: { health: { name: string; ok: boolean; detail?: string }[] }) {
  return (
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
            {check.detail && <div className="mt-0.5 text-xs text-text-muted">{check.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AuditLogTable({ rows, hasAccess }: { rows: AuditLogRow[]; hasAccess: boolean }) {
  if (rows.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-text-secondary">
        {hasAccess
          ? "Пока нет записей — события появятся при регистрациях и ошибках."
          : "Журнал доступен после настройки прав в БД."}
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            <th className="px-3 py-2 font-medium">Время</th>
            <th className="px-3 py-2 font-medium">Уровень</th>
            <th className="px-3 py-2 font-medium">Событие</th>
            <th className="hidden px-3 py-2 font-medium sm:table-cell">Детали</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/50 last:border-0">
              <td className="whitespace-nowrap px-3 py-2 text-xs text-text-muted">
                <LocalDateTime
                  value={row.created_at}
                  options={{ day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }}
                />
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
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium uppercase ${styles[level]}`}
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

import Link from "next/link";
import { DailyBars } from "@/components/admin/daily-bars";
import { Card } from "@/components/ui/card";
import { METRICS_PERIODS, percent, type MetricsDay, type PlatformMetrics } from "@/lib/platform/metrics";
import type { PlatformStats } from "@/lib/platform/queries";
import { cn } from "@/lib/utils";

/** Дни в метрике — даты UTC без времени */
const utcDate = (day: string, month: "short" | "long" = "short") =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("ru-RU", { day: "numeric", month, timeZone: "UTC" });

const sum = (series: MetricsDay[], key: keyof Omit<MetricsDay, "day">) =>
  series.reduce((acc, d) => acc + d[key], 0);

export function MetricsOverview({
  metrics,
  stats,
  days,
}: {
  metrics: PlatformMetrics;
  stats: PlatformStats | null;
  days: number;
}) {
  const { active, funnel, retention, series } = metrics;
  const retentionPct = percent(retention.returned, retention.cohort);
  const avgActive = series.length ? Math.round(sum(series, "active") / series.length) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium">Обзор</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Рост, активность и вовлечённость групп. Дни — по UTC.
          </p>
        </div>
        <div className="flex gap-1" role="group" aria-label="Период">
          {METRICS_PERIODS.map((p) => (
            <Link
              key={p}
              href={p === 30 ? "/admin" : `/admin?days=${p}`}
              aria-current={p === days ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                p === days ? "bg-accent text-accent-ink" : "text-text-secondary hover:bg-bg-3"
              )}
            >
              {p} дней
            </Link>
          ))}
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Tile label="Сегодня заходили" value={active.dau} hint="DAU" />
        <Tile label="За 7 дней" value={active.wau} hint="WAU" />
        <Tile label="За 30 дней" value={active.mau} hint="MAU" />
        <Tile
          label="Вернулись через неделю"
          value={retentionPct === null ? "—" : `${retentionPct}%`}
          hint={
            retention.cohort
              ? `${retention.returned} из ${retention.cohort} зарегистрированных 7–60 дн. назад`
              : "Пока некого считать: нужны регистрации старше недели"
          }
        />
        <Tile
          label="Открытых обращений"
          value={metrics.feedback.open}
          hint={metrics.feedback.new ? `из них новых: ${metrics.feedback.new}` : "новых нет"}
          href="/admin/feedback"
          alert={metrics.feedback.new > 0}
        />
        <Tile
          label="Ошибок за 7 дней"
          value={metrics.errors_7d}
          hint="в журнале событий"
          href="/admin/system"
          alert={metrics.errors_7d > 0}
        />
      </section>
      {active.tracking_since && (
        <p className="-mt-5 text-xs text-text-muted">
          Посещения считаются с{" "}
          {utcDate(active.tracking_since, "long")}{" "}
          — раньше этой даты активность и удержание не видны.
        </p>
      )}

      <section className="grid gap-3 md:grid-cols-2">
        <DailyBars
          title="Активные пользователи"
          summary={`~${avgActive} в день`}
          data={series.map((d) => ({ day: d.day, value: d.active }))}
        />
        <DailyBars
          title="Регистрации"
          summary={String(sum(series, "registrations"))}
          data={series.map((d) => ({ day: d.day, value: d.registrations }))}
        />
        <DailyBars
          title="Новые группы"
          summary={String(sum(series, "bands"))}
          data={series.map((d) => ({ day: d.day, value: d.bands }))}
        />
        <DailyBars
          title="Новые треки (без демо)"
          summary={String(sum(series, "songs"))}
          data={series.map((d) => ({ day: d.day, value: d.songs }))}
        />
      </section>

      <section>
        <SectionTitle>Воронка: от регистрации до работы в группе</SectionTitle>
        <Card className="space-y-3 p-4">
          <FunnelRow label="Зарегистрировались" value={funnel.registered} total={funnel.registered} />
          <FunnelRow label="Состоят в группе" value={funnel.in_band} total={funnel.registered} />
          <FunnelRow
            label="В группе от 2 человек"
            value={funnel.band_with_team}
            total={funnel.registered}
          />
          <FunnelRow
            label="В группе есть свои треки"
            value={funnel.band_with_own_songs}
            total={funnel.registered}
          />
          <FunnelRow label="Подключили Telegram" value={funnel.telegram} total={funnel.registered} />
        </Card>
      </section>

      <section>
        <SectionTitle>Группы по последней активности</SectionTitle>
        {metrics.top_bands.length === 0 ? (
          <Card className="p-6 text-center text-sm text-text-secondary">Групп пока нет</Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                  <th className="px-3 py-2 font-medium">Группа</th>
                  <th className="px-3 py-2 text-right font-medium">Участники</th>
                  <th className="px-3 py-2 text-right font-medium">Треки</th>
                  <th className="px-3 py-2 text-right font-medium">Сет-листы</th>
                  <th className="px-3 py-2 text-right font-medium">События</th>
                  <th className="px-3 py-2 font-medium">Активность</th>
                </tr>
              </thead>
              <tbody>
                {metrics.top_bands.map((b) => (
                  <tr key={b.slug} className="border-b border-border/50 last:border-0">
                    <td className="max-w-[220px] truncate px-3 py-2 font-medium">
                      <Link href={`/${b.slug}`} className="hover:text-accent">
                        {b.name}
                      </Link>
                    </td>
                    <Num value={b.members} />
                    <Num value={b.songs} />
                    <Num value={b.setlists} />
                    <Num value={b.events} />
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-text-secondary">
                      {b.last_activity ? utcDate(b.last_activity) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {stats && (
        <section>
          <SectionTitle>Всего на платформе</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Mini label="Пользователей" value={stats.users} />
            <Mini label="Групп" value={stats.bands} />
            <Mini label="Участников" value={stats.active_members} />
            <Mini label="Треков" value={stats.songs} />
            <Mini label="Сет-листов" value={stats.setlists} />
            <Mini label="Публичных групп" value={stats.public_bands} />
          </div>
        </section>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
      {children}
    </h2>
  );
}

function Tile({
  label,
  value,
  hint,
  href,
  alert,
}: {
  label: string;
  value: number | string;
  hint: string;
  href?: string;
  alert?: boolean;
}) {
  const body = (
    <Card className={cn("h-full p-4", href && "transition-colors hover:border-accent/50")}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-display text-3xl font-bold tabular-nums",
          alert && "text-accent"
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-text-muted">{hint}</div>
    </Card>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

function FunnelRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = percent(value, total) ?? 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="tabular-nums">
          <span className="font-semibold">{value}</span>
          <span className="ml-2 text-xs text-text-muted">{pct}%</span>
        </span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-bg-3" aria-hidden>
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Num({ value }: { value: number }) {
  return (
    <td className={cn("px-3 py-2 text-right tabular-nums", value === 0 && "text-text-muted")}>
      {value}
    </td>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-3">
      <div className="text-[11px] text-text-muted">{label}</div>
      <div className="mt-0.5 text-lg font-medium tabular-nums">{value}</div>
    </Card>
  );
}

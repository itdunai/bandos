import { Card } from "@/components/ui/card";

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

/**
 * Столбики по дням — один ряд, один цвет. Подсказка с датой и значением при
 * наведении на всю колонку (цель шире столбика); таблица для скринридеров.
 */
export function DailyBars({
  title,
  summary,
  data,
}: {
  title: string;
  /** Крупная цифра над графиком (например, сумма за период) */
  summary: string;
  data: { day: string; value: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
          {title}
        </h3>
        <span className="font-display text-xl font-bold tabular-nums">{summary}</span>
      </div>

      <div className="mt-3 flex h-28 items-end gap-[2px]" aria-hidden>
        {data.map((d) => (
          <div key={d.day} className="group relative flex h-full min-w-0 flex-1 items-end">
            <div
              className={
                d.value > 0
                  ? "w-full rounded-t-[2px] bg-accent transition-opacity group-hover:opacity-80"
                  : "h-px w-full bg-border"
              }
              style={d.value > 0 ? { height: `${Math.max(3, (d.value / max) * 100)}%` } : undefined}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-bg-4 px-2 py-1 text-xs shadow-lg group-hover:block">
              <span className="text-text-secondary">{dayLabel(d.day)}:</span>{" "}
              <span className="font-semibold tabular-nums">{d.value}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between border-t border-border pt-1 text-[11px] text-text-muted">
        <span>{data[0] ? dayLabel(data[0].day) : ""}</span>
        <span>{data.length ? dayLabel(data[data.length - 1].day) : ""}</span>
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <th scope="row">{dayLabel(d.day)}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

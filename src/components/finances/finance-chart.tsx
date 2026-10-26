"use client";

import { formatMoney } from "@/lib/finance";

const BAR_MAX = 140;

export function FinanceChart({
  data,
}: {
  data: { key: string; income: number; expense: number }[];
}) {
  if (data.length === 0) return null;

  const max = Math.max(
    ...data.flatMap((d) => [d.income, d.expense]),
    1
  );

  return (
    <div className="rounded-xl border border-border bg-bg-2 p-4">
      <h3 className="mb-5 text-xs font-bold uppercase tracking-wide">Доходы и расходы по месяцам</h3>
      <div className="flex items-end justify-between gap-2 overflow-x-auto pb-1 w-full min-w-0 max-w-full">
        {data.map((month) => {
          const incomeH = Math.round((month.income / max) * BAR_MAX);
          const expenseH = Math.round((month.expense / max) * BAR_MAX);
          const [, m] = month.key.split("-");
          const label = new Date(2000, Number(m) - 1, 1).toLocaleDateString(
            "ru-RU",
            { month: "short" }
          );

          return (
            <div
              key={month.key}
              className="flex min-w-[52px] flex-1 flex-col items-center gap-1"
            >
              <div className="flex items-end gap-1" style={{ height: BAR_MAX + 4 }}>
                <div
                  className="w-4 rounded-t-sm bg-green sm:w-6"
                  style={{ height: `${Math.max(incomeH, 2)}px` }}
                  title={`Доход: ${formatMoney(month.income)}`}
                />
                <div
                  className="w-4 rounded-t-sm bg-red/70 sm:w-6"
                  style={{ height: `${Math.max(expenseH, 2)}px` }}
                  title={`Расход: ${formatMoney(month.expense)}`}
                />
              </div>
              <span className="mt-1 text-xs text-text-muted">{label.replace(".", "")}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-green" />
          Доход
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red/70" />
          Расход
        </span>
      </div>
    </div>
  );
}

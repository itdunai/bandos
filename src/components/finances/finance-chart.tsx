"use client";

import { formatMoney } from "@/lib/finance";

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
      <h3 className="mb-4 text-sm font-medium">Доходы и расходы по месяцам</h3>
      <div className="flex items-end justify-between gap-2 overflow-x-auto pb-1">
        {data.map((month) => {
          const incomeH = Math.round((month.income / max) * 72);
          const expenseH = Math.round((month.expense / max) * 72);
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
              <div className="flex h-[76px] items-end gap-1">
                <div
                  className="w-3 rounded-t bg-green/80"
                  style={{ height: `${Math.max(incomeH, 2)}px` }}
                  title={`Доход: ${formatMoney(month.income)}`}
                />
                <div
                  className="w-3 rounded-t bg-red/70"
                  style={{ height: `${Math.max(expenseH, 2)}px` }}
                  title={`Расход: ${formatMoney(month.expense)}`}
                />
              </div>
              <span className="text-[10px] text-text-muted">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-[11px] text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-green/80" />
          Доход
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-red/70" />
          Расход
        </span>
      </div>
    </div>
  );
}

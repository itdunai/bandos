import type { FinanceTransaction, FinanceTransactionType } from "@/types/database";

export function formatMoney(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function computeFinanceSummary(
  openingBalance: number,
  transactions: Pick<FinanceTransaction, "transaction_type" | "amount">[]
) {
  let income = 0;
  let expense = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    if (tx.transaction_type === "income") income += amount;
    else expense += amount;
  }

  return {
    openingBalance,
    income,
    expense,
    balance: openingBalance + income - expense,
  };
}

export const FINANCE_TYPE_LABELS: Record<FinanceTransactionType, string> = {
  income: "Доход",
  expense: "Расход",
};

export function filterTransactionsByMonth(
  transactions: FinanceTransaction[],
  year: number,
  month: number
) {
  return transactions.filter((tx) => {
    const d = new Date(tx.transaction_at);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function getMonthOptions(transactions: FinanceTransaction[]) {
  const keys = new Set<string>();
  const now = new Date();
  keys.add(`${now.getFullYear()}-${now.getMonth()}`);

  for (const tx of transactions) {
    const d = new Date(tx.transaction_at);
    keys.add(`${d.getFullYear()}-${d.getMonth()}`);
  }

  return [...keys]
    .map((key) => {
      const [y, m] = key.split("-").map(Number);
      return { year: y, month: m };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

export function monthlyTotals(
  transactions: Pick<FinanceTransaction, "transaction_type" | "amount" | "transaction_at">[]
) {
  const map = new Map<string, { income: number; expense: number }>();

  for (const tx of transactions) {
    const d = new Date(tx.transaction_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const row = map.get(key) ?? { income: 0, expense: 0 };
    const amount = Number(tx.amount);
    if (tx.transaction_type === "income") row.income += amount;
    else row.expense += amount;
    map.set(key, row);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, totals]) => ({ key, ...totals }));
}

export function buildFinanceCsv(
  bandName: string,
  openingBalance: number,
  transactions: FinanceTransaction[]
): string {
  const lines = [
    `Группа;${bandName}`,
    `Стартовый баланс;${openingBalance}`,
    "",
    "Дата;Тип;Сумма;Название;Комментарий",
  ];

  for (const tx of transactions) {
    lines.push(
      [
        tx.transaction_at,
        FINANCE_TYPE_LABELS[tx.transaction_type],
        tx.amount,
        tx.title.replace(/;/g, ","),
        (tx.notes ?? "").replace(/;/g, ","),
      ].join(";")
    );
  }

  const summary = computeFinanceSummary(openingBalance, transactions);
  lines.push("", `Итого баланс;${summary.balance}`);
  return "\uFEFF" + lines.join("\n");
}

export function eventIncomeTitle(eventTitle: string) {
  return `Гонорар: ${eventTitle}`;
}

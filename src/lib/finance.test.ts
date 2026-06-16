import { describe, expect, it } from "vitest";
import {
  buildFinanceCsv,
  computeFinanceSummary,
  eventIncomeTitle,
  filterTransactionsByMonth,
  monthlyTotals,
} from "@/lib/finance";
import type { FinanceTransaction } from "@/types/database";

function tx(
  overrides: Partial<FinanceTransaction> & {
    transaction_type: FinanceTransaction["transaction_type"];
    amount: number;
  }
): FinanceTransaction {
  return {
    id: "t1",
    band_id: "b1",
    title: "Test",
    notes: null,
    event_id: null,
    created_by: null,
    created_at: "2025-01-01T00:00:00Z",
    transaction_at: "2025-03-15T12:00:00Z",
    ...overrides,
  };
}

describe("computeFinanceSummary", () => {
  it("calculates balance from opening + income - expense", () => {
    const summary = computeFinanceSummary(1000, [
      { transaction_type: "income", amount: 5000 },
      { transaction_type: "expense", amount: 2000 },
      { transaction_type: "income", amount: 500 },
    ]);
    expect(summary).toEqual({
      openingBalance: 1000,
      income: 5500,
      expense: 2000,
      balance: 4500,
    });
  });
});

describe("filterTransactionsByMonth", () => {
  it("filters by local month", () => {
    const transactions = [
      tx({ id: "a", transaction_at: "2025-03-01T10:00:00Z", amount: 100, transaction_type: "income" }),
      tx({ id: "b", transaction_at: "2025-04-01T10:00:00Z", amount: 200, transaction_type: "expense" }),
    ];
    const march = filterTransactionsByMonth(transactions, 2025, 2);
    expect(march.map((t) => t.id)).toEqual(["a"]);
  });
});

describe("monthlyTotals", () => {
  it("aggregates last months", () => {
    const rows = monthlyTotals([
      tx({ transaction_at: "2025-01-10T00:00:00Z", amount: 1000, transaction_type: "income" }),
      tx({ transaction_at: "2025-01-20T00:00:00Z", amount: 300, transaction_type: "expense" }),
      tx({ transaction_at: "2025-02-05T00:00:00Z", amount: 500, transaction_type: "income" }),
    ]);
    expect(rows).toEqual([
      { key: "2025-01", income: 1000, expense: 300 },
      { key: "2025-02", income: 500, expense: 0 },
    ]);
  });
});

describe("buildFinanceCsv", () => {
  it("includes BOM and closing balance", () => {
    const csv = buildFinanceCsv("Горизонт", 0, [
      tx({ amount: 1000, transaction_type: "income", title: "Концерт" }),
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Итого баланс;1000");
    expect(csv).toContain("Горизонт");
  });
});

describe("eventIncomeTitle", () => {
  it("prefixes event title", () => {
    expect(eventIncomeTitle("Клуб X")).toBe("Гонорар: Клуб X");
  });
});

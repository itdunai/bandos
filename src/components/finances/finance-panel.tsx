"use client";

import {
  addFinanceTransaction,
  deleteFinanceTransaction,
  setOpeningBalance,
} from "@/app/actions/finances";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FinanceChart } from "@/components/finances/finance-chart";
import {
  buildFinanceCsv,
  computeFinanceSummary,
  filterTransactionsByMonth,
  FINANCE_TYPE_LABELS,
  formatMoney,
  getMonthOptions,
  monthlyTotals,
} from "@/lib/finance";
import { formatDate } from "@/lib/utils";
import type { FinanceTransaction } from "@/types/database";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Mic2,
  Trash2,
  Wallet,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

interface PerformanceOption {
  id: string;
  title: string;
  starts_at: string;
  fee: number;
}

export function FinancePanel({
  bandId,
  bandSlug,
  bandName,
  openingBalance,
  transactions,
  performances,
  isAdmin,
}: {
  bandId: string;
  bandSlug: string;
  bandName: string;
  openingBalance: number;
  transactions: FinanceTransaction[];
  performances: PerformanceOption[];
  isAdmin: boolean;
}) {
  const monthOptions = useMemo(() => getMonthOptions(transactions), [transactions]);
  const [filterKey, setFilterKey] = useState<string>("all");

  const filteredTransactions = useMemo(() => {
    if (filterKey === "all") return transactions;
    const [year, month] = filterKey.split("-").map(Number);
    return filterTransactionsByMonth(transactions, year, month);
  }, [transactions, filterKey]);

  const summary = computeFinanceSummary(openingBalance, transactions);
  const chartData = useMemo(() => monthlyTotals(transactions), [transactions]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<"income" | "expense" | null>(
    null
  );
  const [selectedEventId, setSelectedEventId] = useState("");

  const selectedPerformance = performances.find((p) => p.id === selectedEventId);

  function handleOpeningBalance(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await setOpeningBalance(bandId, bandSlug, formData);
      if (result.error) setError(result.error);
    });
  }

  function handleAddTransaction(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeForm) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("transaction_type", activeForm);
    if (selectedEventId) formData.set("event_id", selectedEventId);
    setError(null);
    startTransition(async () => {
      const result = await addFinanceTransaction(bandId, bandSlug, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      form.reset();
      setActiveForm(null);
      setSelectedEventId("");
    });
  }

  function handleExportCsv() {
    const csv = buildFinanceCsv(bandName, openingBalance, transactions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finances-${bandSlug}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleDelete(id: string) {
    if (!confirm("Удалить операцию?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteFinanceTransaction(id, bandId, bandSlug);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider text-text-muted">
            Текущий баланс
          </div>
          <div className="mt-1 flex items-center gap-2 text-2xl font-medium text-accent">
            <Wallet className="h-5 w-5" />
            {formatMoney(summary.balance)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider text-text-muted">
            Стартовый баланс
          </div>
          <div className="mt-1 text-xl font-medium">
            {formatMoney(summary.openingBalance)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-1 text-xs uppercase tracking-wider text-text-muted">
            <ArrowDownLeft className="h-3 w-3 text-green" />
            Доходы
          </div>
          <div className="mt-1 text-xl font-medium text-green">
            +{formatMoney(summary.income)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-1 text-xs uppercase tracking-wider text-text-muted">
            <ArrowUpRight className="h-3 w-3 text-red" />
            Расходы
          </div>
          <div className="mt-1 text-xl font-medium text-red">
            −{formatMoney(summary.expense)}
          </div>
        </Card>
      </div>

      {error && (
        <div className="rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">Период:</label>
          <select
            value={filterKey}
            onChange={(e) => setFilterKey(e.target.value)}
            className="rounded-lg border border-border bg-bg-3 px-3 py-1.5 text-sm outline-none focus:border-accent"
          >
            <option value="all">Все операции</option>
            {monthOptions.map(({ year, month }) => {
              const key = `${year}-${month}`;
              const label = new Date(year, month, 1).toLocaleDateString("ru-RU", {
                month: "long",
                year: "numeric",
              });
              return (
                <option key={key} value={key}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
        <Button type="button" variant="default" size="sm" onClick={handleExportCsv}>
          <Download className="h-3.5 w-3.5" />
          Экспорт CSV
        </Button>
      </div>

      <FinanceChart data={chartData} />

      {isAdmin && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-medium">Стартовый баланс</h3>
          <p className="mb-3 text-xs text-text-secondary">
            Начальная сумма на счёте группы до учёта операций в BandOS.
          </p>
          <form
            onSubmit={handleOpeningBalance}
            className="flex flex-wrap items-end gap-2"
          >
            <div className="min-w-[160px] flex-1">
              <Input
                name="opening_balance"
                type="number"
                min={0}
                step="0.01"
                defaultValue={openingBalance}
                required
              />
            </div>
            <Button type="submit" variant="accent" loading={pending} disabled={pending}>
              {pending ? "Сохранение…" : "Сохранить"}
            </Button>
          </form>
        </Card>
      )}

      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={activeForm === "income" ? "accent" : "default"}
            onClick={() =>
              setActiveForm((f) => (f === "income" ? null : "income"))
            }
          >
            <ArrowDownLeft className="h-3.5 w-3.5" />
            Добавить доход
          </Button>
          <Button
            type="button"
            variant={activeForm === "expense" ? "accent" : "default"}
            onClick={() =>
              setActiveForm((f) => (f === "expense" ? null : "expense"))
            }
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Добавить расход
          </Button>
        </div>
      )}

      {isAdmin && activeForm && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-medium">
            {activeForm === "income" ? "Новый доход" : "Новый расход"}
          </h3>
          <form onSubmit={handleAddTransaction} className="space-y-3">
            {activeForm === "income" && performances.length > 0 && (
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  Концерт (гонорар)
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg-3 px-3 py-2 text-sm outline-none focus:border-accent"
                >
                  <option value="">— Вручную —</option>
                  {performances.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} · {formatMoney(p.fee)} ·{" "}
                      {formatDate(p.starts_at)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  Сумма, ₽
                </label>
                <Input
                  name="amount"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  defaultValue={selectedPerformance?.fee ?? ""}
                  key={selectedEventId || "manual"}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  Дата
                </label>
                <Input
                  name="transaction_at"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">
                Название
              </label>
              <Input
                name="title"
                required
                placeholder={
                  activeForm === "income" ? "Гонорар, донат…" : "Реклама, транспорт…"
                }
                defaultValue={
                  selectedPerformance
                    ? `Гонорар: ${selectedPerformance.title}`
                    : ""
                }
                key={`title-${selectedEventId || "manual"}`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">
                Комментарий
              </label>
              <Input name="notes" placeholder="Необязательно" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="accent" loading={pending} disabled={pending}>
                {pending ? "Сохранение…" : "Сохранить"}
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() => {
                  setActiveForm(null);
                  setSelectedEventId("");
                }}
              >
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div>
        <h3 className="mb-3 text-xs uppercase tracking-wider text-text-muted">
          Операции
        </h3>
        {filteredTransactions.length === 0 ? (
          <Card className="p-6 text-center text-sm text-text-secondary">
            Пока нет записей.{" "}
            {isAdmin
              ? "Задайте стартовый баланс и добавьте доходы или расходы."
              : "Администратор может добавить операции."}
          </Card>
        ) : (
          <ul className="space-y-2">
            {filteredTransactions.map((tx) => (
              <li
                key={tx.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-bg-2 px-4 py-3"
              >
                <div
                  className={
                    tx.transaction_type === "income"
                      ? "mt-0.5 text-green"
                      : "mt-0.5 text-red"
                  }
                >
                  {tx.transaction_type === "income" ? (
                    <ArrowDownLeft className="h-4 w-4" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{tx.title}</span>
                    <span className="text-[11px] text-text-muted">
                      {FINANCE_TYPE_LABELS[tx.transaction_type]}
                    </span>
                    {tx.event_id && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-bg-3 px-2 py-0.5 text-[10px] text-accent">
                        <Mic2 className="h-3 w-3" />
                        Концерт
                      </span>
                    )}
                  </div>
                  {tx.notes && (
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {tx.notes}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-text-muted">
                    {formatDate(tx.transaction_at, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div
                  className={
                    tx.transaction_type === "income"
                      ? "shrink-0 text-sm font-medium text-green"
                      : "shrink-0 text-sm font-medium text-red"
                  }
                >
                  {tx.transaction_type === "income" ? "+" : "−"}
                  {formatMoney(tx.amount)}
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(tx.id)}
                    disabled={pending}
                    className="shrink-0 p-1 text-text-muted hover:text-red"
                    aria-label="Удалить"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

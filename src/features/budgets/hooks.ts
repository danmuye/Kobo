import { useMemo, useCallback } from "react";
import { useFinanceStore } from "@/store/finance";
import {
  calculateBudgetMetrics,
  getBudgetInsights,
  getBudgetAnalytics,
  getBudgetAvailableToSpend,
  getBudgetPeriodRange,
  isBudgetPeriodEnded,
  type BudgetMetrics,
  type BudgetInsights,
  type BudgetAnalytics,
  type BudgetAvailableToSpend,
} from "@/services/budget-matching";
import { getFinanceService } from "@/services/service-provider";
import type { Budget, BudgetHistoryEntry } from "@/types";

const id = () => Math.random().toString(36).slice(2, 10);

export interface BudgetWithMetrics extends Budget {
  metrics: BudgetMetrics;
}

export interface BudgetWithDetails extends BudgetWithMetrics {
  insights: BudgetInsights;
  analytics: BudgetAnalytics;
  availableToSpend: BudgetAvailableToSpend;
  history: BudgetHistoryEntry[];
  periodEnded: boolean;
}

export function useBudgetsPage() {
  const budgets = useFinanceStore((s) => s.budgets);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgetHistory = useFinanceStore((s) => s.budgetHistory);
  const addBudgetHistoryAction = useFinanceStore((s) => s.addBudgetHistory);

  const budgetsWithDetails = useMemo(
    () => budgets.map((b) => {
      const metrics = calculateBudgetMetrics(b, transactions);
      return {
        ...b,
        metrics,
        insights: getBudgetInsights(b, transactions),
        analytics: getBudgetAnalytics(b, transactions),
        availableToSpend: getBudgetAvailableToSpend(b, transactions),
        history: budgetHistory.filter((h) => h.budgetId === b.id),
        periodEnded: isBudgetPeriodEnded(b),
      } as BudgetWithDetails;
    }),
    [budgets, transactions, budgetHistory],
  );

  const totalBudgeted = useMemo(
    () => budgets.reduce((sum, b) => sum + b.amount, 0),
    [budgets],
  );

  const totalSpent = useMemo(
    () => budgetsWithDetails.reduce((sum, b) => sum + b.metrics.spent, 0),
    [budgetsWithDetails],
  );

  const svc = getFinanceService();

  const archiveBudgetPeriod = useCallback((budget: Budget, metrics: BudgetMetrics) => {
    const range = getBudgetPeriodRange(budget);
    if (!range) return;
    const entry: BudgetHistoryEntry = {
      id: id(),
      budgetId: budget.id,
      budgetName: budget.name,
      period: budget.period,
      amount: budget.amount,
      spent: metrics.spent,
      remaining: metrics.remaining,
      percentage: metrics.percentage,
      transactionCount: metrics.transactionCount,
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
      archivedAt: new Date().toISOString(),
    };
    addBudgetHistoryAction(entry);
  }, [addBudgetHistoryAction]);

  return {
    budgets: budgetsWithDetails,
    totalBudgeted,
    totalSpent,
    addBudget: (data: Omit<Budget, "id">) => svc.budgets.create(data),
    updateBudget: (id: string, data: Partial<Budget>) => svc.budgets.update(id, data),
    deleteBudget: (id: string) => svc.budgets.delete(id),
    archiveBudgetPeriod,
  };
}

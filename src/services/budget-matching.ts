import type { Budget, Transaction } from "@/types";

export function getBudgetCategories(budget: Partial<Pick<Budget, "categories">> & { category?: string }): string[] {
  if (Array.isArray(budget.categories) && budget.categories.length > 0) {
    return budget.categories;
  }
  if (budget.category && typeof budget.category === "string") {
    return [budget.category];
  }
  return [];
}

export function getBudgetSafeArray<T>(arr: T[] | null | undefined): T[] {
  return Array.isArray(arr) ? arr : [];
}

export interface BudgetMetrics {
  spent: number;
  remaining: number;
  percentage: number;
  transactionCount: number;
  isOverBudget: boolean;
}

export type BudgetStatusValue = "on-track" | "near-limit" | "exceeded";
export interface BudgetStatusInfo {
  label: "On Track" | "Near Limit" | "Exceeded";
  tone: "success" | "warning" | "destructive";
  value: BudgetStatusValue;
}

export function getBudgetStatus(percentage: number): BudgetStatusInfo {
  if (percentage > 100) return { label: "Exceeded", tone: "destructive", value: "exceeded" };
  if (percentage >= 90) return { label: "Near Limit", tone: "warning", value: "near-limit" };
  if (percentage >= 70) return { label: "Near Limit", tone: "warning", value: "near-limit" };
  return { label: "On Track", tone: "success", value: "on-track" };
}

export type BudgetTrend = "improvement" | "decline" | "stable";

export function getBudgetPeriodRange(budget: Budget, referenceDate: Date): { start: Date; end: Date } | null {
  const ref = new Date(referenceDate);

  if (budget.period === "Custom") {
    if (!budget.startDate || !budget.endDate) return null;
    const start = new Date(budget.startDate);
    const end = new Date(budget.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    return { start, end };
  }

  if (budget.startDate && budget.endDate) {
    const start = new Date(budget.startDate);
    const end = new Date(budget.endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      return { start, end };
    }
  }

  switch (budget.period) {
    case "Monthly": {
      const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "Weekly": {
      const day = ref.getDay();
      const diff = ref.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(ref.getFullYear(), ref.getMonth(), diff);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "Yearly": {
      const start = new Date(ref.getFullYear(), 0, 1);
      const end = new Date(ref.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
    default:
      return null;
  }
}

export function migrateBudget(budget: any): Budget {
  return {
    ...budget,
    categories: getBudgetCategories(budget),
    accounts: getBudgetSafeArray(budget.accounts),
    wallets: getBudgetSafeArray(budget.wallets),
    tags: getBudgetSafeArray(budget.tags),
    period: ["Monthly", "Weekly", "Yearly", "Custom"].includes(budget.period) ? budget.period : "Monthly",
    color: budget.color || "#3b82f6",
    createdAt: budget.createdAt || new Date().toISOString(),
    updatedAt: budget.updatedAt || new Date().toISOString(),
  };
}

export function calculateBudgetMetrics(
  budget: Budget,
  transactions: Transaction[],
  referenceDate: Date = new Date(),
): BudgetMetrics {
  const range = getBudgetPeriodRange(budget, referenceDate);
  if (!range) {
    return { spent: 0, remaining: budget.amount, percentage: 0, transactionCount: 0, isOverBudget: false };
  }

  const matching = getMatchingBudgetTransactions(budget, transactions, range);

  const spent = matching.reduce((sum, t) => sum + t.amount, 0);
  const remaining = budget.amount - spent;
  const percentage = budget.amount === 0 ? 0 : (spent / budget.amount) * 100;

  return {
    spent,
    remaining,
    percentage,
    transactionCount: matching.length,
    isOverBudget: spent > budget.amount,
  };
}

export function computeBudgetUtilization(budgets: Budget[], transactions: Transaction[]) {
  let totalBudgeted = 0;
  let totalSpent = 0;

  for (const b of budgets) {
    const metrics = calculateBudgetMetrics(b, transactions);
    totalBudgeted += b.amount;
    totalSpent += metrics.spent;
  }

  return {
    totalBudgeted,
    totalSpent,
    utilization: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
  };
}

export interface BudgetInsights {
  averageDailySpend: number;
  projectedEndSpend: number;
  projectedRemaining: number;
  isOverBudgetForecast: boolean;
  daysRemaining: number;
  dailyAllowance: number;
}

export function getBudgetPeriodDaysRemaining(budget: Budget, referenceDate: Date = new Date()): number {
  const range = getBudgetPeriodRange(budget, referenceDate);
  if (!range) return 0;
  const now = referenceDate.getTime();
  const end = range.end.getTime();
  if (now >= end) return 0;
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

export function getBudgetInsights(
  budget: Budget,
  transactions: Transaction[],
  referenceDate: Date = new Date(),
): BudgetInsights {
  const range = getBudgetPeriodRange(budget, referenceDate);
  if (!range) {
    return {
      averageDailySpend: 0, projectedEndSpend: 0, projectedRemaining: budget.amount,
      isOverBudgetForecast: false, daysRemaining: 0, dailyAllowance: budget.amount,
    };
  }

  const rangeStart = range.start.getTime();
  const rangeEnd = range.end.getTime();
  const now = referenceDate.getTime();
  const daysRemaining = Math.max(0, Math.ceil((rangeEnd - now) / (1000 * 60 * 60 * 24)));

  const daysElapsed = Math.max(1, Math.ceil((now - rangeStart) / (1000 * 60 * 60 * 24)));

  const metrics = calculateBudgetMetrics(budget, transactions, referenceDate);
  const averageDailySpend = metrics.spent / daysElapsed;

  const totalDays = Math.max(1, Math.ceil((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24)));
  const projectedEndSpend = averageDailySpend * totalDays;
  const projectedRemaining = budget.amount - projectedEndSpend;
  const isOverBudgetForecast = projectedEndSpend > budget.amount;

  const dailyAllowance = daysRemaining > 0 ? Math.max(0, metrics.remaining) / daysRemaining : 0;

  return {
    averageDailySpend,
    projectedEndSpend,
    projectedRemaining,
    isOverBudgetForecast,
    daysRemaining,
    dailyAllowance,
  };
}

export interface BudgetAnalytics {
  topCategories: { name: string; amount: number; pct: number }[];
  largestTransaction: { amount: number; description: string; date: string } | null;
  averageTransaction: number;
  dailyTrend: { date: string; amount: number }[];
}

export function getBudgetAnalytics(
  budget: Budget,
  transactions: Transaction[],
  referenceDate: Date = new Date(),
): BudgetAnalytics {
  const range = getBudgetPeriodRange(budget, referenceDate);
  if (!range) {
    return { topCategories: [], largestTransaction: null, averageTransaction: 0, dailyTrend: [] };
  }

  const matching = getMatchingBudgetTransactions(budget, transactions, range);

  const catMap = new Map<string, number>();
  let totalAmount = 0;
  let maxTxn: { amount: number; description: string; date: string } | null = null;
  const dailyMap = new Map<string, number>();

  for (const t of matching) {
    totalAmount += t.amount;
    catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount);

    if (!maxTxn || t.amount > maxTxn.amount) {
      maxTxn = { amount: t.amount, description: t.description, date: t.date };
    }

    const dayKey = t.date.slice(0, 10);
    dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + t.amount);
  }

  const topCategories = Array.from(catMap.entries())
    .map(([name, amount]) => ({ name, amount, pct: totalAmount > 0 ? (amount / totalAmount) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const dailyTrend = Array.from(dailyMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    topCategories,
    largestTransaction: maxTxn,
    averageTransaction: matching.length > 0 ? totalAmount / matching.length : 0,
    dailyTrend,
  };
}

function getMatchingBudgetTransactions(
  budget: Budget,
  transactions: Transaction[],
  range: { start: Date; end: Date },
): Transaction[] {
  return transactions.filter((t) => {
    if (t.type === "income" || t.type === "transfer") return false;
    if (!t.budgetId || t.budgetId !== budget.id) return false;
    const txTime = new Date(t.date).getTime();
    if (txTime < range.start.getTime() || txTime > range.end.getTime()) return false;
    const accts = getBudgetSafeArray(budget.accounts);
    if (accts.length > 0 && !accts.includes(t.account)) return false;
    const wallets = getBudgetSafeArray(budget.wallets);
    if (wallets.length > 0 && !wallets.includes(t.account)) return false;
    const tags = getBudgetSafeArray(budget.tags);
    if (tags.length > 0) {
      const txTags = getBudgetSafeArray(t.tags);
      if (!txTags.some((tag) => tags.includes(tag))) return false;
    }
    return true;
  });
}

export interface BudgetAvailableToSpend {
  dailyBudget: number;
  weeklyBudget: number;
  spentToday: number;
  spentThisWeek: number;
  remainingToday: number;
  remainingThisWeek: number;
  projectedDailyRemaining: number;
  pace: "ahead" | "on-track" | "behind";
}

export function getBudgetAvailableToSpend(
  budget: Budget,
  transactions: Transaction[],
  referenceDate: Date = new Date(),
): BudgetAvailableToSpend {
  const range = getBudgetPeriodRange(budget, referenceDate);
  if (!range) {
    return {
      dailyBudget: 0, weeklyBudget: 0, spentToday: 0, spentThisWeek: 0,
      remainingToday: 0, remainingThisWeek: 0, projectedDailyRemaining: 0, pace: "on-track",
    };
  }

  const ref = referenceDate;
  const dayStart = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const rangeStart = range.start.getTime();
  const rangeEnd = range.end.getTime();
  const totalDays = Math.max(1, Math.ceil((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(1, Math.ceil((ref.getTime() - rangeStart) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.ceil((rangeEnd - ref.getTime()) / (1000 * 60 * 60 * 24)));

  const metrics = calculateBudgetMetrics(budget, transactions, referenceDate);
  const dailyBudget = budget.amount / totalDays;
  const weeklyBudget = dailyBudget * 7;

  const matching = getMatchingBudgetTransactions(budget, transactions, range);
  const spentToday = matching
    .filter((t) => new Date(t.date) >= dayStart)
    .reduce((s, t) => s + t.amount, 0);
  const spentThisWeek = matching
    .filter((t) => new Date(t.date) >= weekStart)
    .reduce((s, t) => s + t.amount, 0);

  const remainingToday = dailyBudget - spentToday;
  const remainingThisWeek = weeklyBudget - spentThisWeek;

  const averageDailySpend = metrics.spent / daysElapsed;
  const expectedDailySpend = averageDailySpend;
  const projectedDailyRemaining = dailyBudget - expectedDailySpend;

  const pace: "ahead" | "on-track" | "behind" =
    daysRemaining > 0
      ? metrics.spent / daysElapsed < budget.amount / totalDays
        ? "ahead"
        : metrics.spent / daysElapsed > budget.amount / totalDays * 1.1
          ? "behind"
          : "on-track"
      : metrics.spent <= budget.amount ? "ahead" : "behind";

  return {
    dailyBudget, weeklyBudget, spentToday, spentThisWeek,
    remainingToday, remainingThisWeek, projectedDailyRemaining, pace,
  };
}

export function isBudgetPeriodEnded(budget: Budget, referenceDate: Date = new Date()): boolean {
  const range = getBudgetPeriodRange(budget, referenceDate);
  if (!range) return false;
  return referenceDate.getTime() > range.end.getTime();
}

export function getBudgetPeriodEndDate(budget: Budget, referenceDate: Date = new Date()): Date | null {
  const range = getBudgetPeriodRange(budget, referenceDate);
  return range?.end ?? null;
}

export function getNextBudgetPeriodStart(budget: Budget, referenceDate: Date = new Date()): Date | null {
  const range = getBudgetPeriodRange(budget, referenceDate);
  if (!range) return null;
  const next = new Date(range.end);
  next.setDate(next.getDate() + 1);
  return next;
}

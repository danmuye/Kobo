import type { Transaction, Budget, SavingsGoal, GoalContributionEntry, Debt, Account } from "@/types";
import {
  getTotalIncome, getTotalExpenses, getNetCashFlow,
  getTotalSaved, getTotalTarget, getTotalSavingsProgress,
  getMonthlyGoalContributions, getMonthlyChart, getCategoryBreakdown,
  getMonthlySummary, getGoalProgress, getBudgetProgress, getCurrentBalance,
} from "@/store/finance";

export type DateRangePreset = "today" | "week" | "month" | "year" | "custom";

export interface DateRange {
  preset: DateRangePreset;
  start: string;
  end: string;
}

export function getDateRange(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string,
): DateRange {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  let start: string;
  const end: string = customEnd ?? today;

  switch (preset) {
    case "today":
      start = today;
      break;
    case "week": {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      start = weekStart.toISOString().slice(0, 10);
      break;
    }
    case "month": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      start = monthStart.toISOString().slice(0, 10);
      break;
    }
    case "year": {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      start = yearStart.toISOString().slice(0, 10);
      break;
    }
    case "custom":
      start = customStart ?? today;
      break;
    default:
      start = today;
  }

  return { preset, start, end };
}

export function filterByDateRange<T extends { date: string }>(
  items: T[],
  range: DateRange,
): T[] {
  const startMs = new Date(range.start).getTime();
  const endMs = new Date(range.end).getTime() + 86_400_000;
  return items.filter((item) => {
    const itemMs = new Date(item.date).getTime();
    return itemMs >= startMs && itemMs <= endMs;
  });
}

export function getMonthsFromRange(range: DateRange): number {
  if (range.preset === "today" || range.preset === "week") return 1;
  if (range.preset === "month") return 2;
  if (range.preset === "year") return 12;
  const start = new Date(range.start);
  const end = new Date(range.end);
  return Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1);
}

export interface IncomeExpensesReport {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
}

export function computeIncomeExpenses(transactions: Transaction[]): IncomeExpensesReport {
  return {
    totalIncome: getTotalIncome(transactions),
    totalExpenses: getTotalExpenses(transactions),
    netCashFlow: getNetCashFlow(transactions),
  };
}

export interface SavingsGrowthReport {
  totalSaved: number;
  totalTarget: number;
  remaining: number;
  pct: number;
  monthly: { month: string; contributions: number }[];
}

export function computeSavingsGrowth(
  goals: SavingsGoal[],
  contributions: GoalContributionEntry[],
  months = 6,
): SavingsGrowthReport {
  const progress = getTotalSavingsProgress(goals);
  return {
    totalSaved: progress.saved,
    totalTarget: progress.target,
    remaining: progress.remaining,
    pct: progress.pct,
    monthly: getMonthlyGoalContributions(contributions, months),
  };
}

export interface BudgetUtilizationReport {
  totalBudgeted: number;
  totalSpent: number;
  utilization: number;
  budgets: (Budget & { progress: ReturnType<typeof getBudgetProgress> })[];
}

export function computeBudgetUtilization(budgets: Budget[]): BudgetUtilizationReport {
  const budgetsWithProgress = budgets.map((b) => ({ ...b, progress: getBudgetProgress(b) }));
  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  return {
    totalBudgeted,
    totalSpent,
    utilization: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
    budgets: budgetsWithProgress,
  };
}

export interface DebtSummaryReport {
  totalDebt: number;
  totalOriginal: number;
  totalMin: number;
  paidOff: number;
  count: number;
}

export function computeDebtSummary(debts: Debt[]): DebtSummaryReport {
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const totalOriginal = debts.reduce((s, d) => s + d.originalAmount, 0);
  const totalMin = debts.reduce((s, d) => s + d.minPayment, 0);
  return {
    totalDebt,
    totalOriginal,
    totalMin,
    paidOff: totalOriginal - totalDebt,
    count: debts.length,
  };
}

export function getDebtPaidPercent(debt: Debt): number {
  if (debt.originalAmount === 0) return 0;
  return ((debt.originalAmount - debt.balance) / debt.originalAmount) * 100;
}

export interface AccountBalanceReport {
  totalBalance: number;
  accounts: Account[];
}

export function computeAccountBalances(accounts: Account[]): AccountBalanceReport {
  return {
    totalBalance: getCurrentBalance(accounts),
    accounts,
  };
}

export interface ReportResult {
  range: DateRange;
  incomeExpenses: IncomeExpensesReport;
  savingsGrowth: SavingsGrowthReport;
  budgetUtilization: BudgetUtilizationReport;
  debtSummary: DebtSummaryReport;
  accountBalances: AccountBalanceReport;
  monthlyChart: ReturnType<typeof getMonthlyChart>;
  categoryBreakdown: ReturnType<typeof getCategoryBreakdown>;
  monthlySummary: ReturnType<typeof getMonthlySummary>;
}

export function computeReport(
  data: {
    transactions: Transaction[];
    budgets: Budget[];
    goals: SavingsGoal[];
    goalContributions: GoalContributionEntry[];
    debts: Debt[];
    accounts: Account[];
  },
  range: DateRange,
): ReportResult {
  const months = getMonthsFromRange(range);

  return {
    range,
    incomeExpenses: computeIncomeExpenses(data.transactions),
    savingsGrowth: computeSavingsGrowth(data.goals, data.goalContributions, months),
    budgetUtilization: computeBudgetUtilization(data.budgets),
    debtSummary: computeDebtSummary(data.debts),
    accountBalances: computeAccountBalances(data.accounts),
    monthlyChart: getMonthlyChart(data.transactions, months),
    categoryBreakdown: getCategoryBreakdown(data.transactions),
    monthlySummary: getMonthlySummary(data.transactions),
  };
}

// ── Comparison Mode ──────────────────────────────────────────────────────────

export function getPreviousDateRange(range: DateRange): DateRange {
  const start = new Date(range.start);
  const end = new Date(range.end);
  const spanMs = end.getTime() - start.getTime();

  const prevEnd = new Date(start.getTime() - 86_400_000);
  const prevStart = new Date(prevEnd.getTime() - spanMs);

  return {
    preset: range.preset,
    start: prevStart.toISOString().slice(0, 10),
    end: prevEnd.toISOString().slice(0, 10),
  };
}

export function getPeriodLabel(range: DateRange): string {
  switch (range.preset) {
    case "today":
      return "Today vs Yesterday";
    case "week":
      return "This Week vs Last Week";
    case "month":
      return "This Month vs Last Month";
    case "year":
      return "This Year vs Last Year";
    case "custom":
      return `${range.start} to ${range.end}`;
    default:
      return "Current vs Previous";
  }
}

function computePctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : current < 0 ? -100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export interface SpendingTrend {
  direction: "up" | "down" | "stable";
  pctChange: number;
  currentPeriodTotal: number;
  previousPeriodTotal: number;
}

export function computeSpendingTrend(
  transactions: Transaction[],
  range: DateRange,
): SpendingTrend {
  const prevRange = getPreviousDateRange(range);
  const current = filterByDateRange(transactions, range);
  const previous = filterByDateRange(transactions, prevRange);
  const currentTotal = getTotalExpenses(current);
  const previousTotal = getTotalExpenses(previous);
  const pctChange = computePctChange(currentTotal, previousTotal);
  const direction =
    pctChange > 5 ? "up" : pctChange < -5 ? "down" : "stable";
  return { direction, pctChange, currentPeriodTotal: currentTotal, previousPeriodTotal: previousTotal };
}

export function computeIncomeTrend(
  transactions: Transaction[],
  range: DateRange,
): SpendingTrend {
  const prevRange = getPreviousDateRange(range);
  const current = filterByDateRange(transactions, range);
  const previous = filterByDateRange(transactions, prevRange);
  const currentTotal = getTotalIncome(current);
  const previousTotal = getTotalIncome(previous);
  const pctChange = computePctChange(currentTotal, previousTotal);
  const direction =
    pctChange > 5 ? "up" : pctChange < -5 ? "down" : "stable";
  return { direction, pctChange, currentPeriodTotal: currentTotal, previousPeriodTotal: previousTotal };
}

export interface HealthScore {
  score: number;
  label: string;
  details: {
    incomeExpense: number;
    savingsRate: number;
    budgetAdherence: number;
    debtLevel: number;
  };
}

export function computeHealthScore(
  transactions: Transaction[],
  budgets: Budget[],
  debts: Debt[],
  range: DateRange,
): HealthScore {
  const filtered = filterByDateRange(transactions, range);
  const totalIncome = getTotalIncome(filtered);
  const totalExpenses = getTotalExpenses(filtered);

  // Income/Expense ratio: 0-25 points
  const ieRatio = totalIncome / Math.max(totalExpenses, 1);
  const incomeExpense = Math.min(25, Math.round(ieRatio * 7.5));

  // Savings rate: 0-25 points
  const savingsRateVal = Math.max(totalIncome - totalExpenses, 0) / Math.max(totalIncome, 1);
  const savingsRate = Math.min(25, Math.round(savingsRateVal * 125));

  // Budget adherence: 0-25 points
  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + Math.min(b.spent, b.amount), 0);
  const utilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 100;
  const budgetAdherence = Math.max(0, Math.round(25 - utilization / 4));

  // Debt level: 0-25 points
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const annualIncome = totalIncome || 1;
  const debtRatio = totalDebt / annualIncome;
  const debtLevel = Math.max(0, Math.min(25, Math.round(25 * (1 - Math.min(debtRatio, 2) / 2))));

  const score = incomeExpense + savingsRate + budgetAdherence + debtLevel;

  let label: string;
  if (score >= 80) label = "Excellent";
  else if (score >= 60) label = "Good";
  else if (score >= 40) label = "Fair";
  else if (score >= 20) label = "Poor";
  else label = "Critical";

  return { score, label, details: { incomeExpense, savingsRate, budgetAdherence, debtLevel } };
}

export interface FinancialInsights {
  highestSpendingCategory: { name: string; amount: number; pctOfTotal: number } | null;
  largestExpense: Transaction | null;
  fastestGrowingGoal: { goalId: string; goalName: string; monthlyRate: number; pct: number } | null;
  budgetOverspending: { overspentCount: number; totalOverspent: number; overspentNames: string[] };
  healthScore: HealthScore;
  spendingTrend: SpendingTrend;
  incomeTrend: SpendingTrend;
}

export function computeFinancialInsights(
  transactions: Transaction[],
  budgets: Budget[],
  goals: SavingsGoal[],
  goalContributions: GoalContributionEntry[],
  debts: Debt[],
  range: DateRange,
): FinancialInsights {
  const filtered = filterByDateRange(transactions, range);
  const expenseTransactions = filtered.filter((t) => t.type === "expense");

  // Highest spending category
  const categoryMap = new Map<string, number>();
  expenseTransactions.forEach((t) => {
    categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
  });
  const categoryEntries = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1]);
  const totalExpenses = expenseTransactions.reduce((s, t) => s + t.amount, 0);
  const highestSpendingCategory = categoryEntries.length > 0
    ? { name: categoryEntries[0][0], amount: categoryEntries[0][1], pctOfTotal: totalExpenses > 0 ? (categoryEntries[0][1] / totalExpenses) * 100 : 0 }
    : null;

  // Largest single expense
  const largestExpense = expenseTransactions.length > 0
    ? expenseTransactions.reduce((max, t) => (t.amount > max.amount ? t : max), expenseTransactions[0])
    : null;

  // Fastest growing savings goal (highest monthly contribution rate)
  let fastestGrowingGoal: FinancialInsights["fastestGrowingGoal"] = null;
  if (goals.length > 0) {
    let bestRate = 0;
    for (const g of goals) {
      const progress = getGoalProgress(g, goalContributions);
      if (progress.monthlyRate > bestRate) {
        bestRate = progress.monthlyRate;
        fastestGrowingGoal = {
          goalId: g.id,
          goalName: g.name,
          monthlyRate: progress.monthlyRate,
          pct: progress.pct,
        };
      }
    }
  }

  // Budget overspending summary
  const overspentBudgets = budgets.filter((b) => b.spent > b.amount);
  const budgetOverspending = {
    overspentCount: overspentBudgets.length,
    totalOverspent: overspentBudgets.reduce((s, b) => s + (b.spent - b.amount), 0),
    overspentNames: overspentBudgets.map((b) => b.name),
  };

  const healthScore = computeHealthScore(transactions, budgets, debts, range);
  const spendingTrend = computeSpendingTrend(transactions, range);
  const incomeTrend = computeIncomeTrend(transactions, range);

  return {
    highestSpendingCategory,
    largestExpense,
    fastestGrowingGoal,
    budgetOverspending,
    healthScore,
    spendingTrend,
    incomeTrend,
  };
}

export interface ComparisonEntry {
  label: string;
  current: number;
  previous: number;
  pctChange: number;
  isPositive: boolean; // true means "good" (higher income, lower expenses, etc.)
}

export interface ComparisonResult {
  periodLabel: string;
  entries: ComparisonEntry[];
  currentRange: DateRange;
  previousRange: DateRange;
}

export function computeComparison(
  data: {
    transactions: Transaction[];
  },
  range: DateRange,
): ComparisonResult {
  const prevRange = getPreviousDateRange(range);

  const currentTxs = filterByDateRange(data.transactions, range);
  const previousTxs = filterByDateRange(data.transactions, prevRange);

  const current = computeIncomeExpenses(currentTxs);
  const previous = computeIncomeExpenses(previousTxs);

  return {
    periodLabel: getPeriodLabel(range),
    currentRange: range,
    previousRange: prevRange,
    entries: [
      {
        label: "Income",
        current: current.totalIncome,
        previous: previous.totalIncome,
        pctChange: computePctChange(current.totalIncome, previous.totalIncome),
        isPositive: current.totalIncome >= previous.totalIncome,
      },
      {
        label: "Expenses",
        current: current.totalExpenses,
        previous: previous.totalExpenses,
        pctChange: computePctChange(current.totalExpenses, previous.totalExpenses),
        isPositive: current.totalExpenses <= previous.totalExpenses,
      },
      {
        label: "Net Cash Flow",
        current: current.netCashFlow,
        previous: previous.netCashFlow,
        pctChange: computePctChange(current.netCashFlow, previous.netCashFlow),
        isPositive: current.netCashFlow >= previous.netCashFlow,
      },
    ],
  };
}

// ── Filter helpers ───────────────────────────────────────────────────────────

export function filterTransactions(
  transactions: Transaction[],
  filters: {
    categories?: string[];
    accounts?: string[];
    types?: string[];
  },
): Transaction[] {
  return transactions.filter((t) => {
    if (filters.categories && filters.categories.length > 0 && !filters.categories.includes(t.category)) return false;
    if (filters.accounts && filters.accounts.length > 0) {
      const matchesAccount = t.account && filters.accounts.includes(t.account);
      const matchesFrom = t.fromAccount && filters.accounts.includes(t.fromAccount);
      const matchesTo = t.toAccount && filters.accounts.includes(t.toAccount);
      if (!matchesAccount && !matchesFrom && !matchesTo) return false;
    }
    if (filters.types && filters.types.length > 0 && !filters.types.includes(t.type)) return false;
    return true;
  });
}

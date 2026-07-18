import type { Transaction, Budget, Goal, Debt, Account } from "@/types";
import {
  getTotalIncome, getTotalExpenses, getNetCashFlow,
  getMonthlyChart, getCategoryBreakdown,
  getMonthlySummary, getCurrentBalance,
  calculateGoalsTotal, getMonthlyGoalSavings, calculateGoalMetrics,
} from "@/store/finance";
import { calculateBudgetMetrics, computeBudgetUtilization as computeUtilization } from "./budget-matching";
import { calculateDebtMetrics } from "./debt-matching";

function safeNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function safeDivide(a: number, b: number): number {
  return b === 0 || !Number.isFinite(a) ? 0 : a / b;
}

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
  const safe = Array.isArray(items) ? items : [];
  const startMs = new Date(range.start).getTime();
  const endMs = new Date(range.end).getTime() + 86_400_000;
  return safe.filter((item) => {
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
  const safe = Array.isArray(transactions) ? transactions : [];
  return {
    totalIncome: getTotalIncome(safe),
    totalExpenses: getTotalExpenses(safe),
    netCashFlow: getNetCashFlow(safe),
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
  goals: Goal[],
  transactions: Transaction[],
  months = 6,
): SavingsGrowthReport {
  const progress = calculateGoalsTotal(goals, transactions);
  return {
    totalSaved: progress.totalSaved,
    totalTarget: progress.totalTarget,
    remaining: progress.remaining,
    pct: progress.pct,
    monthly: getMonthlyGoalSavings(goals, transactions, months),
  };
}

export interface BudgetUtilizationReport {
  totalBudgeted: number;
  totalSpent: number;
  utilization: number;
  budgets: (Budget & { metrics: ReturnType<typeof calculateBudgetMetrics> })[];
}

export function computeBudgetUtilization(budgets: Budget[], transactions: Transaction[]): BudgetUtilizationReport {
  const safeBudgets = Array.isArray(budgets) ? budgets : [];
  const safeTxs = Array.isArray(transactions) ? transactions : [];
  const withMetrics = safeBudgets.map((b) => ({ ...b, metrics: calculateBudgetMetrics(b, safeTxs) }));
  const totalBudgeted = safeBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = withMetrics.reduce((s, b) => s + b.metrics.spent, 0);
  return {
    totalBudgeted,
    totalSpent,
    utilization: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
    budgets: withMetrics,
  };
}

export interface DebtSummaryReport {
  totalDebt: number;
  totalOriginal: number;
  totalMin: number;
  paidOff: number;
  count: number;
}

export function computeDebtSummary(debts: Debt[], transactions: Transaction[]): DebtSummaryReport {
  const safe = Array.isArray(debts) ? debts : [];
  let totalOriginal = 0;
  let totalPaid = 0;
  let totalMin = 0;
  for (const d of safe) {
    const m = calculateDebtMetrics(d, transactions);
    totalOriginal += d.originalAmount;
    totalPaid += m.amountPaid;
    totalMin += d.minimumPayment;
  }
  return {
    totalDebt: totalOriginal - totalPaid,
    totalOriginal,
    totalMin,
    paidOff: totalPaid,
    count: safe.length,
  };
}

export function getDebtPaidPercent(debt: Debt, transactions: Transaction[]): number {
  if (debt.originalAmount === 0) return 0;
  const m = calculateDebtMetrics(debt, transactions);
  return m.percentagePaid;
}

export interface AccountBalanceReport {
  totalBalance: number;
  accounts: Account[];
}

export function computeAccountBalances(accounts: Account[], transactions: Transaction[]): AccountBalanceReport {
  return {
    totalBalance: getCurrentBalance(accounts, transactions),
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
    goals: Goal[];
    debts: Debt[];
    accounts: Account[];
  } | null | undefined,
  range: DateRange,
): ReportResult {
  const safe = data || {} as typeof data;
  const months = getMonthsFromRange(range);
  const txs = Array.isArray(safe.transactions) ? safe.transactions : [];

  return {
    range,
    incomeExpenses: computeIncomeExpenses(txs),
    savingsGrowth: computeSavingsGrowth(safe.goals, txs, months),
    budgetUtilization: computeBudgetUtilization(safe.budgets, txs),
    debtSummary: computeDebtSummary(safe.debts, txs),
    accountBalances: computeAccountBalances(safe.accounts, txs),
    monthlyChart: getMonthlyChart(txs, months),
    categoryBreakdown: getCategoryBreakdown(txs),
    monthlySummary: getMonthlySummary(txs),
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
  const safe = Array.isArray(transactions) ? transactions : [];
  const prevRange = getPreviousDateRange(range);
  const current = filterByDateRange(safe, range);
  const previous = filterByDateRange(safe, prevRange);
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
  const safe = Array.isArray(transactions) ? transactions : [];
  const prevRange = getPreviousDateRange(range);
  const current = filterByDateRange(safe, range);
  const previous = filterByDateRange(safe, prevRange);
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
  const safeTxs = Array.isArray(transactions) ? transactions : [];
  const safeBudgets = Array.isArray(budgets) ? budgets : [];
  const safeDebts = Array.isArray(debts) ? debts : [];
  const filtered = filterByDateRange(safeTxs, range);
  const totalIncome = safeNumber(getTotalIncome(filtered));
  const totalExpenses = safeNumber(getTotalExpenses(filtered));

  // Income/Expense ratio: 0-25 points
  const ieRatio = safeDivide(totalIncome, Math.max(totalExpenses, 1));
  const incomeExpense = Math.min(25, Math.round(safeNumber(ieRatio * 7.5)));

  // Savings rate: 0-25 points
  const savingsRateVal = safeDivide(Math.max(totalIncome - totalExpenses, 0), Math.max(totalIncome, 1));
  const savingsRate = Math.min(25, Math.round(safeNumber(savingsRateVal * 125)));

  // Budget adherence: 0-25 points
  const { totalBudgeted, totalSpent } = safeBudgets.length > 0 ? computeUtilization(safeBudgets, safeTxs) : { totalBudgeted: 0, totalSpent: 0 };
  const safeBudgeted = safeNumber(totalBudgeted);
  const safeSpent = safeNumber(totalSpent);
  const utilization = safeBudgeted > 0 ? (safeSpent / safeBudgeted) * 100 : 100;
  const budgetAdherence = Math.max(0, Math.round(safeNumber(25 - safeDivide(utilization, 4))));

  // Debt level: 0-25 points
  const totalDebt = safeDebts.reduce((s, d) => s + safeNumber(d.originalAmount), 0);
  const annualIncome = safeNumber(totalIncome) || 1;
  const debtRatio = safeDivide(totalDebt, annualIncome);
  const debtLevel = Math.max(0, Math.min(25, Math.round(safeNumber(25 * (1 - safeDivide(Math.min(debtRatio, 2), 2))))));

  const score = safeNumber(incomeExpense) + safeNumber(savingsRate) + safeNumber(budgetAdherence) + safeNumber(debtLevel);

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
  goals: Goal[],
  debts: Debt[],
  range: DateRange,
): FinancialInsights {
  const safeTxs = Array.isArray(transactions) ? transactions : [];
  const safeBudgets = Array.isArray(budgets) ? budgets : [];
  const safeGoals = Array.isArray(goals) ? goals : [];
  const safeDebts = Array.isArray(debts) ? debts : [];
  const filtered = filterByDateRange(safeTxs, range);
  const expenseTransactions = filtered.filter((t) => t.type === "expense");

  // Highest spending category
  const categoryMap = new Map<string, number>();
  for (let i = 0; i < expenseTransactions.length; i++) {
    const t = expenseTransactions[i];
    categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
  }
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
  if (safeGoals.length > 0) {
    let bestRate = 0;
    for (let i = 0; i < safeGoals.length; i++) {
      const metrics = calculateGoalMetrics(safeGoals[i], safeTxs);
      if (metrics.averageMonthlyRate > bestRate) {
        bestRate = metrics.averageMonthlyRate;
        fastestGrowingGoal = {
          goalId: safeGoals[i].id,
          goalName: safeGoals[i].name,
          monthlyRate: metrics.averageMonthlyRate,
          pct: metrics.percentage,
        };
      }
    }
  }

  // Budget overspending summary
  const overspentBudgets = safeBudgets.filter((b) => calculateBudgetMetrics(b, safeTxs).isOverBudget);
  const budgetOverspending = {
    overspentCount: overspentBudgets.length,
    totalOverspent: overspentBudgets.reduce((s, b) => s + calculateBudgetMetrics(b, safeTxs).spent - b.amount, 0),
    overspentNames: overspentBudgets.map((b) => b.name),
  };

  const healthScore = computeHealthScore(safeTxs, safeBudgets, safeDebts, range);
  const spendingTrend = computeSpendingTrend(safeTxs, range);
  const incomeTrend = computeIncomeTrend(safeTxs, range);

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
  const safeData = data && data.transactions ? data : { transactions: [] };
  const safeTxs = Array.isArray(safeData.transactions) ? safeData.transactions : [];
  const prevRange = getPreviousDateRange(range);

  const currentTxs = filterByDateRange(safeTxs, range);
  const previousTxs = filterByDateRange(safeTxs, prevRange);

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
  const safe = Array.isArray(transactions) ? transactions : [];
  return safe.filter((t) => {
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

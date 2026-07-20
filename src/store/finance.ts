import { create } from "zustand";
import type { Transaction, Budget, BudgetHistoryEntry, Goal, Debt, Account } from "@/types";
import type { GoalHistoryEntry } from "@/services/goal-insights";
import type { DebtHistoryEntry } from "@/services/debt-history";
import { migrateBudget } from "@/services/budget-matching";
import { migrateGoal, getMatchingGoalTransactions } from "@/services/goal-matching";
import { migrateDebt } from "@/services/debt-matching";
import { archiveDebtMetrics } from "@/services/debt-history";
import { computeBalances } from "@/services/account-balance";
import { getAccountsActivity, type ActivityLevel } from "@/services/account-activity";
const id = () => Math.random().toString(36).slice(2, 10);

interface State {
  transactions: Transaction[];
  budgets: Budget[];
  budgetHistory: BudgetHistoryEntry[];
  goals: Goal[];
  goalHistory: GoalHistoryEntry[];
  debts: Debt[];
  debtHistory: DebtHistoryEntry[];
  accounts: Account[];

  addTransaction: (t: Omit<Transaction, "id"> & { id?: string }) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addBudget: (b: Omit<Budget, "id"> & { id?: string }) => void;
  updateBudget: (id: string, b: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  addBudgetHistory: (h: Omit<BudgetHistoryEntry, "id"> & { id?: string }) => void;
  deleteBudgetHistory: (id: string) => void;
  clearBudgetHistory: (budgetId: string) => void;
  getBudgetHistory: (budgetId: string) => BudgetHistoryEntry[];

  addGoal: (g: Omit<Goal, "id"> & { id?: string }) => void;
  updateGoal: (id: string, g: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  addGoalHistory: (h: Omit<GoalHistoryEntry, "id"> & { id?: string }) => void;
  getGoalHistory: (goalId: string) => GoalHistoryEntry[];

  addDebt: (d: Omit<Debt, "id"> & { id?: string }) => void;
  updateDebt: (id: string, d: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  addDebtHistory: (h: Omit<DebtHistoryEntry, "id"> & { id?: string }) => void;
  clearDebtHistory: (debtId: string) => void;

  addAccount: (a: Omit<Account, "id"> & { id?: string }) => void;
  updateAccount: (id: string, a: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  /** Clear all finance data (transactions, budgets, goals, debts, accounts). */
  clearAllData: () => void;
  /** Bulk-import data (used by backup restore). */
  restoreData: (data: {
    transactions: Transaction[];
    budgets: Budget[];
    budgetHistory?: BudgetHistoryEntry[];
    goals: Goal[];
    goalHistory?: GoalHistoryEntry[];
    debts: Debt[];
    debtHistory?: DebtHistoryEntry[];
    accounts: Account[];
  }) => void;
}

export const useFinanceStore = create<State>()(
  (set, get) => ({
    transactions: [],
    budgets: [],
    budgetHistory: [],
    goals: [],
    goalHistory: [],
    debts: [],
    debtHistory: [],
    accounts: [],

    addTransaction: (t) =>
      set((s) => {
        const newTx: Transaction = { ...t, id: t.id ?? id() };
        return { transactions: [newTx, ...s.transactions] };
      }),

    updateTransaction: (tid, t) =>
      set((s) => {
        const oldTx = s.transactions.find((x) => x.id === tid);
        if (!oldTx) return s;
        const merged: Transaction = { ...oldTx, ...t };
        return { transactions: s.transactions.map((x) => (x.id === tid ? merged : x)) };
      }),

    deleteTransaction: (tid) =>
      set((s) => {
        const tx = s.transactions.find((x) => x.id === tid);
        if (!tx) return s;
        return { transactions: s.transactions.filter((x) => x.id !== tid) };
      }),

    addBudget: (b) => set((s) => ({ budgets: [migrateBudget({ ...b, id: b.id ?? id() }), ...s.budgets] })),
    updateBudget: (bid, b) => set((s) => ({ budgets: s.budgets.map((x) => x.id === bid ? migrateBudget({ ...x, ...b }) : x) })),
    deleteBudget: (bid) => set((s) => ({ budgets: s.budgets.filter((x) => x.id !== bid) })),

    addBudgetHistory: (h) => set((s) => ({ budgetHistory: [{ ...h, id: h.id ?? id() }, ...s.budgetHistory] })),
    deleteBudgetHistory: (hid) => set((s) => ({ budgetHistory: s.budgetHistory.filter((x) => x.id !== hid) })),
    clearBudgetHistory: (budgetId) => set((s) => ({ budgetHistory: s.budgetHistory.filter((x) => x.budgetId !== budgetId) })),
    getBudgetHistory: (budgetId) => get().budgetHistory.filter((h) => h.budgetId === budgetId),

    addGoal: (g) => set((s) => ({ goals: [migrateGoal({ ...g, id: g.id ?? id() } as Record<string, unknown>), ...s.goals] })),
    updateGoal: (gid, g) => set((s) => ({ goals: s.goals.map((x) => x.id === gid ? migrateGoal({ ...x, ...g } as Record<string, unknown>) : x) })),
    deleteGoal: (gid) => set((s) => ({ goals: s.goals.filter((x) => x.id !== gid) })),
    addGoalHistory: (h) => set((s) => ({ goalHistory: [{ ...h, id: h.id ?? id() }, ...s.goalHistory] })),
    getGoalHistory: (goalId) => get().goalHistory.filter((h) => h.goalId === goalId),

    addDebt: (d) => set((s) => ({ debts: [migrateDebt({ ...d, id: d.id ?? id() } as Record<string, unknown>), ...s.debts] })),
    updateDebt: (did, d) => set((s) => ({ debts: s.debts.map((x) => x.id === did ? migrateDebt({ ...x, ...d } as Record<string, unknown>) : x) })),
    deleteDebt: (did) => set((s) => ({ debts: s.debts.filter((x) => x.id !== did) })),
    addDebtHistory: (h) => set((s) => ({ debtHistory: [{ ...h, id: h.id ?? id() }, ...s.debtHistory] })),
    clearDebtHistory: (debtId) => set((s) => ({ debtHistory: s.debtHistory.filter((h) => h.debtId !== debtId) })),

    addAccount: (a) => set((s) => ({ accounts: [{ ...a, id: a.id ?? id() }, ...s.accounts] })),
    updateAccount: (aid, a) => set((s) => ({ accounts: s.accounts.map((x) => x.id === aid ? { ...x, ...a } : x) })),
    deleteAccount: (aid) => set((s) => ({ accounts: s.accounts.filter((x) => x.id !== aid) })),

    clearAllData: () =>
      set({
        transactions: [],
        budgets: [],
        budgetHistory: [],
        goals: [],
        goalHistory: [],
        debts: [],
        debtHistory: [],
        accounts: [],
      }),

    restoreData: (data: {
      transactions: Transaction[];
      budgets: Budget[];
      budgetHistory?: BudgetHistoryEntry[];
      goals: Goal[];
      goalHistory?: GoalHistoryEntry[];
      debts: Debt[];
      debtHistory?: DebtHistoryEntry[];
      accounts: Account[];
    }) =>
      set({
        transactions: Array.isArray(data?.transactions) ? data.transactions : [],
        budgets: Array.isArray(data?.budgets) ? data.budgets.map(migrateBudget) : [],
        budgetHistory: Array.isArray(data?.budgetHistory) ? data.budgetHistory : [],
        goals: Array.isArray(data?.goals) ? data.goals.map((g) => migrateGoal(g as Record<string, unknown>)) : [],
        goalHistory: Array.isArray(data?.goalHistory) ? data.goalHistory : [],
        debts: Array.isArray(data?.debts) ? data.debts.map((d) => migrateDebt(d as Record<string, unknown>)) : [],
        debtHistory: Array.isArray(data?.debtHistory) ? data.debtHistory : [],
        accounts: Array.isArray(data?.accounts) ? data.accounts : [],
      }),
  }),
);

// ── Shared finance selectors ──────────────────────────────────────────────────
// These replace duplicate inline calculations in Dashboard, Reports, and services.

/** Total balance across all accounts (computed from opening balances + transactions). */
export function getTotalBalance(accounts: Account[], transactions: Transaction[]) {
  const balances = computeBalances(accounts, transactions);
  return accounts.reduce((sum, account) => sum + (balances.get(account.id) ?? 0), 0);
}

/** Current balance — alias for `getTotalBalance`. Semantic clarity in account context. */
export function getCurrentBalance(accounts: Account[], transactions: Transaction[]) {
  return getTotalBalance(accounts, transactions);
}

/** Available balance — total balance minus current-month expenses. */
export function getAvailableBalance(accounts: Account[], transactions: Transaction[]) {
  const total = getTotalBalance(accounts, transactions);
  const { expenses } = getMonthlySummary(transactions);
  return total - expenses;
}

/** Total income across all transactions. */
export function getTotalIncome(transactions: Transaction[]) {
  const safe = Array.isArray(transactions) ? transactions : [];
  return safe
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Total expenses across all transactions. */
export function getTotalExpenses(transactions: Transaction[]) {
  const safe = Array.isArray(transactions) ? transactions : [];
  return safe
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Net cash flow — total income minus total expenses. */
export function getNetCashFlow(transactions: Transaction[]) {
  return getTotalIncome(transactions) - getTotalExpenses(transactions);
}

/** Date string of the most recent transaction, or null if there are none. */
export function getLastTransactionDate(transactions: Transaction[]): string | null {
  const safe = Array.isArray(transactions) ? transactions : [];
  if (safe.length === 0) return null;
  return safe.reduce((latest, t) => (t.date > latest ? t.date : latest), safe[0].date);
}

export interface MonthlyAccountSummaryEntry {
  accountName: string;
  income: number;
  expenses: number;
  transferIn: number;
  transferOut: number;
  net: number;
  transactionCount: number;
}

/** Per-account income/expenses/transfers for the current month. */
export function getMonthlyAccountSummary(accounts: Account[], transactions: Transaction[]): MonthlyAccountSummaryEntry[] {
  const safeTxs = Array.isArray(transactions) ? transactions : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthTxs = safeTxs.filter((t) => new Date(t.date) >= monthStart);

  return safeAccounts.map((account) => {
    const income = monthTxs
      .filter((t) => t.type === "income" && t.account === account.name)
      .reduce((s, t) => s + t.amount, 0);
    const expenses = monthTxs
      .filter((t) => t.type === "expense" && t.account === account.name)
      .reduce((s, t) => s + t.amount, 0);
    const transferIn = monthTxs
      .filter((t) => t.type === "transfer" && t.toAccount === account.name)
      .reduce((s, t) => s + t.amount, 0);
    const transferOut = monthTxs
      .filter((t) => t.type === "transfer" && t.fromAccount === account.name)
      .reduce((s, t) => s + t.amount, 0);
    const transactionCount = monthTxs.filter(
      (t) => t.account === account.name || t.fromAccount === account.name || t.toAccount === account.name,
    ).length;

    return {
      accountName: account.name,
      income,
      expenses,
      transferIn,
      transferOut,
      net: income + transferIn - expenses - transferOut,
      transactionCount,
    };
  });
}

// ── Transfer selectors ────────────────────────────────────────────────────────

export interface TransferValidation {
  valid: boolean;
  errors: string[];
}

/** Validate a transfer transaction against the current accounts list. */
export function validateTransfer(
  transaction: { fromAccount?: string; toAccount?: string; amount?: number },
  accounts: Account[],
): TransferValidation {
  const errors: string[] = [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  if (!transaction.fromAccount?.trim()) errors.push("Source account is required");
  if (!transaction.toAccount?.trim()) errors.push("Destination account is required");
  if (transaction.fromAccount && transaction.toAccount && transaction.fromAccount === transaction.toAccount)
    errors.push("Cannot transfer to the same account");
  if (transaction.fromAccount && !safeAccounts.some((a) => a.name === transaction.fromAccount))
    errors.push(`Source account "${transaction.fromAccount}" not found`);
  if (transaction.toAccount && !safeAccounts.some((a) => a.name === transaction.toAccount))
    errors.push(`Destination account "${transaction.toAccount}" not found`);
  return { valid: errors.length === 0, errors };
}

/** All transfer transactions sorted by date descending. */
export function getTransferHistory(transactions: Transaction[]): Transaction[] {
  const safe = Array.isArray(transactions) ? transactions : [];
  return safe
    .filter((t) => t.type === "transfer")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Net amount transferred into an account (incoming - outgoing, 0 if no transfers). */
export function getNetTransferBalance(accountName: string, transactions: Transaction[]): number {
  const safe = Array.isArray(transactions) ? transactions : [];
  let net = 0;
  for (let i = 0; i < safe.length; i++) {
    const t = safe[i];
    if (t.type !== "transfer") continue;
    if (t.toAccount === accountName) net += t.amount;
    if (t.fromAccount === accountName) net -= t.amount;
  }
  return net;
}

// ── Account analysis selectors ─────────────────────────────────────────────────

export interface AccountTrendEntry {
  month: string;
  income: number;
  expenses: number;
  net: number;
  balance: number;
}

export interface AccountTrend {
  accountName: string;
  data: AccountTrendEntry[];
}

/** Monthly income/expense/net/balance trend per account for the last N months. */
export function getMonthlyAccountTrends(
  accounts: Account[],
  transactions: Transaction[],
  months = 6,
): AccountTrend[] {
  const safeAcc = Array.isArray(accounts) ? accounts : [];
  const safeTxs = Array.isArray(transactions) ? transactions : [];
  const now = new Date();
  const buckets: { key: string; label: string; start: Date }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    buckets.push({ key: label, label, start: d });
  }

  return safeAcc.map((account) => {
    let runningBalance = account.openingBalance;
    // Compute balance at each bucket boundary from transactions before that point
    const sortedTxs = safeTxs
      .filter((t) => {
        if (t.type === "transfer")
          return t.fromAccount === account.name || t.toAccount === account.name;
        return t.account === account.name;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      accountName: account.name,
      data: buckets.map((bucket, idx) => {
        const bucketEnd = idx < buckets.length - 1 ? buckets[idx + 1].start : new Date();
        const txs = sortedTxs.filter((t) => {
          const d = new Date(t.date);
          return d >= bucket.start && d < bucketEnd;
        });
        const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expenses = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const transferIn = txs.filter((t) => t.type === "transfer" && t.toAccount === account.name).reduce((s, t) => s + t.amount, 0);
        const transferOut = txs.filter((t) => t.type === "transfer" && t.fromAccount === account.name).reduce((s, t) => s + t.amount, 0);
        const net = income + transferIn - expenses - transferOut;
        runningBalance += net;
        return { month: bucket.label, income, expenses, net, balance: runningBalance };
      }),
    };
  });
}

export interface ActivityTimelineEntry {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  relatedAccount?: string;
  fromAccount?: string;
  toAccount?: string;
}

/** The most recent transactions for a given account, formatted as a timeline. */
export function getAccountActivityTimeline(
  accountName: string,
  transactions: Transaction[],
  limit = 10,
): ActivityTimelineEntry[] {
  const safe = Array.isArray(transactions) ? transactions : [];
  return safe
    .filter((t) => {
      if (t.type === "transfer") return t.fromAccount === accountName || t.toAccount === accountName;
      return t.account === accountName;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
    .map((t) => {
      if (t.type === "transfer") {
        const related = t.fromAccount === accountName ? t.toAccount : t.fromAccount;
        return { ...t, relatedAccount: related };
      }
      return t;
    });
}

export interface AccountHealth {
  accountName: string;
  growth: number;
  incomeExpenseRatio: number;
  activityLevel: ActivityLevel;
  monthlyTransactionsAvg: number;
  monthsOfExpensesCovered: number;
  trend: "up" | "down" | "stable";
}

/** Health indicators per account. */
export function getAccountsHealth(
  accounts: Account[],
  transactions: Transaction[],
): AccountHealth[] {
  const safeAcc = Array.isArray(accounts) ? accounts : [];
  const safeTxs = Array.isArray(transactions) ? transactions : [];
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const recentTxs = safeTxs.filter((t) => new Date(t.date) >= threeMonthsAgo);
  const balanceMap = computeBalances(safeAcc, safeTxs);
  const activityMap = new Map(
    getAccountsActivity(safeAcc, safeTxs).map((a) => [a.accountName, a.activityLevel]),
  );

  return safeAcc.map((account) => {
    const accountTxs = recentTxs.filter((t) => {
      if (t.type === "transfer") return t.fromAccount === account.name || t.toAccount === account.name;
      return t.account === account.name;
    });

    const totalIncome = accountTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpenses = accountTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const totalTransferIn = accountTxs.filter((t) => t.type === "transfer" && t.toAccount === account.name).reduce((s, t) => s + t.amount, 0);
    const totalTransferOut = accountTxs.filter((t) => t.type === "transfer" && t.fromAccount === account.name).reduce((s, t) => s + t.amount, 0);

    const netIncome = totalIncome + totalTransferIn;
    const netExpenses = totalExpenses + totalTransferOut;
    const bal = balanceMap.get(account.id) ?? 0;
    const growth = account.openingBalance > 0
      ? ((bal - account.openingBalance) / account.openingBalance) * 100
      : bal > 0 ? 100 : 0;

    const incomeExpenseRatio = netExpenses > 0 ? netIncome / netExpenses : netIncome > 0 ? Infinity : 1;

    const monthsInRange = 3;
    const transactionCount = accountTxs.length;
    const monthlyTransactionsAvg = transactionCount / monthsInRange;
    const activityLevel = activityMap.get(account.name) ?? "inactive";

    // Months of expenses covered by current balance
    const monthlyExpenseAvg = totalExpenses / monthsInRange;
    const monthsOfExpensesCovered = monthlyExpenseAvg > 0 && bal ? bal / monthlyExpenseAvg : Infinity;

    // Trend direction based on recent net vs older net
    const olderTxs = safeTxs.filter((t) => {
      if (t.type === "transfer") return t.fromAccount === account.name || t.toAccount === account.name;
      return t.account === account.name;
    }).filter((t) => {
      const d = new Date(t.date);
      return d >= new Date(now.getFullYear(), now.getMonth() - 6, 1) && d < threeMonthsAgo;
    });
    const olderIncome = olderTxs.filter((t) => t.type === "income" || (t.type === "transfer" && t.toAccount === account.name))
      .reduce((s, t) => s + t.amount, 0);
    const olderExpenses = olderTxs.filter((t) => t.type === "expense" || (t.type === "transfer" && t.fromAccount === account.name))
      .reduce((s, t) => s + t.amount, 0);
    const olderNet = olderIncome - olderExpenses;
    const recentNet = netIncome - netExpenses;
    const trend: AccountHealth["trend"] =
      recentNet > olderNet * 1.1 ? "up"
        : recentNet < olderNet * 0.9 ? "down"
          : "stable";

    return {
      accountName: account.name,
      growth: Math.round(growth * 100) / 100,
      incomeExpenseRatio: Math.round(incomeExpenseRatio * 100) / 100,
      activityLevel,
      monthlyTransactionsAvg: Math.round(monthlyTransactionsAvg * 10) / 10,
      monthsOfExpensesCovered: monthsOfExpensesCovered === Infinity ? -1 : Math.round(monthsOfExpensesCovered * 10) / 10,
      trend,
    };
  });
}

/** Filter accounts by one or more types and return the filtered list. */
export function getAccountsByType(accounts: Account[], types: AccountType[]): Account[] {
  const safe = Array.isArray(accounts) ? accounts : [];
  const safeTypes = Array.isArray(types) ? types : [];
  return safe.filter((a) => safeTypes.includes(a.type));
}

/** Income, expenses, and savings for the current month-to-date. */
export function getMonthlySummary(transactions: Transaction[], referenceDate = new Date()) {
  const safeTxs = Array.isArray(transactions) ? transactions : [];
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const monthTransactions = safeTxs.filter((transaction) => new Date(transaction.date) >= monthStart);
  const income = monthTransactions.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = monthTransactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0);
  return { income, expenses, savings: Math.max(income - expenses, 0) };
}

export interface MonthlyChartEntry {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

/** Build a monthly income/expenses chart for the last N months. */
export function getMonthlyChart(transactions: Transaction[], months = 6): MonthlyChartEntry[] {
  const map = new Map<string, MonthlyChartEntry>();
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    map.set(key, { month: key, income: 0, expenses: 0, net: 0 });
  }
  const safe = Array.isArray(transactions) ? transactions : [];
  for (let i = 0; i < safe.length; i++) {
    const t = safe[i];
    const d = new Date(t.date);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    const entry = map.get(key);
    if (entry) {
      if (t.type === "income") entry.income += t.amount;
      else entry.expenses += t.amount;
      entry.net = entry.income - entry.expenses;
    }
  }
  return Array.from(map.values());
}

export interface CategoryBreakdownEntry {
  name: string;
  value: number;
}

/** Aggregate expenses by category, sorted descending. */
export function getCategoryBreakdown(transactions: Transaction[]): CategoryBreakdownEntry[] {
  const safe = Array.isArray(transactions) ? transactions : [];
  const map = new Map<string, number>();
  for (let i = 0; i < safe.length; i++) {
    const t = safe[i];
    if (t.type === "expense") {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    }
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/** Derive cash flow (net) from a monthly chart. */
export function getCashFlow(chart: MonthlyChartEntry[]): { month: string; cashFlow: number }[] {
  const safe = Array.isArray(chart) ? chart : [];
  return safe.map((m) => ({ month: m.month, cashFlow: m.income - m.expenses }));
}

// ── Goal selectors (re-exported from goal-matching service) ──────────────────

export {
  calculateDebtMetrics,
  calculateDebtTotals,
  getDebtStatus,
  getMatchingDebtTransactions,
  type DebtMetrics,
  type DebtStatusInfo,
  type DebtStatusValue,
} from "@/services/debt-matching";

export function getDebtMetrics(debtId: string, debts: Debt[], transactions: Transaction[]) {
  const debt = debts.find((d) => d.id === debtId);
  if (!debt) return null;
  return calculateDebtMetrics(debt, transactions);
}

export {
  calculateGoalMetrics,
  getGoalStatus,
  getGoalFastestGrowing,
  calculateGoalsTotal,
  getMonthlyGoalSavings,
  getGoalCompletionForecast,
  getGoalOverallTimeline,
  getMatchingGoalTransactions,
  type GoalMetrics,
  type GoalStatusInfo,
  type GoalCompletionForecast,
  type GoalOverallTimeline,
  type MonthlyGoalSavings,
} from "@/services/goal-matching";

export {
  getGoalAnalytics,
  archiveGoalMetrics,
  getContributionTrend,
  getMonthlyProgress,
  type GoalHistoryEntry,
  type GoalAnalytics,
  type ContributionTrendPoint,
  type MonthlyProgressPoint,
} from "@/services/goal-insights";

export function getGoalDaysRemaining(goal: Goal) {
  const now = new Date();
  const deadline = new Date(goal.targetDate);
  const diff = deadline.getTime() - now.getTime();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

export {
  calculateDebtInsights,
  getPaymentTrend,
  getOutstandingTrend,
  getDebtDistribution,
  getPayoffForecast,
  getDebtUtilization,
  getPaymentCalendar,
  getDebtAnalytics,
  type DebtInsights,
  type PaymentTrendPoint,
  type OutstandingTrendPoint,
  type DebtDistribution,
  type PayoffForecast,
  type DebtUtilization,
  type PaymentCalendarEntry,
  type DebtAnalytics,
} from "@/services/debt-insights";

export {
  archiveDebtMetrics,
  getDebtPaymentMilestones,
  getDebtMonthlySummary,
  type DebtHistoryEntry,
  type DebtPeriodSummary,
} from "@/services/debt-history";
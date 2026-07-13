import { create } from "zustand";
import { seedAccounts, seedBudgets, seedDebts, seedGoals, seedGoalContributions, seedGoalMilestones, seedTransactions } from "@/data/finance";
import type { Transaction, Budget, SavingsGoal, GoalContributionEntry, GoalMilestone, Debt, Account } from "@/types";
const id = () => Math.random().toString(36).slice(2, 10);

interface State {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  goalContributions: GoalContributionEntry[];
  goalMilestones: GoalMilestone[];
  debts: Debt[];
  accounts: Account[];

  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addBudget: (b: Omit<Budget, "id">) => void;
  updateBudget: (id: string, b: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  addGoal: (g: Omit<SavingsGoal, "id">) => void;
  updateGoal: (id: string, g: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;

  addGoalContribution: (c: Omit<GoalContributionEntry, "id">) => void;
  updateGoalContribution: (id: string, c: Partial<GoalContributionEntry>) => void;
  deleteGoalContribution: (id: string) => void;

  addDebt: (d: Omit<Debt, "id">) => void;
  updateDebt: (id: string, d: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;

  addAccount: (a: Omit<Account, "id">) => void;
  updateAccount: (id: string, a: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  /** Snapshot the current spent into history and reset spent to 0. */
  archiveBudget: (id: string) => void;

  /** Reset all data to the original demo seed data. */
  resetDemoData: () => void;
  /** Clear all finance data (transactions, budgets, goals, debts, accounts). */
  clearAllData: () => void;
  /** Bulk-import data (used by backup restore). */
  restoreData: (data: {
    transactions: Transaction[];
    budgets: Budget[];
    goals: SavingsGoal[];
    goalContributions: GoalContributionEntry[];
    goalMilestones: GoalMilestone[];
    debts: Debt[];
    accounts: Account[];
  }) => void;
}

/** Recompute goal.saved by summing its contributions, and return the updated goal. */
function recomputeGoalSaved(goal: SavingsGoal, contributions: GoalContributionEntry[]): SavingsGoal {
  const total = contributions
    .filter((c) => c.goalId === goal.id)
    .reduce((sum, c) => sum + c.amount, 0);
  return { ...goal, saved: total };
}

/** Recompute saved for all goals and return the updated goals array. */
function recomputeAllGoals(goals: SavingsGoal[], contributions: GoalContributionEntry[]): SavingsGoal[] {
  return goals.map((g) => recomputeGoalSaved(g, contributions));
}

const MILESTONE_PCTS = [10, 25, 50, 75, 90, 100] as const;

/** Check if any new milestones were reached for a goal and create them. */
function checkAndCreateMilestones(
  goal: SavingsGoal,
  contributions: GoalContributionEntry[],
  existingMilestones: GoalMilestone[],
): GoalMilestone[] {
  if (goal.target === 0) return [];
  const pct = Math.min((goal.saved / goal.target) * 100, 100);
  const reached = existingMilestones.filter((m) => m.goalId === goal.id && m.pct <= pct).map((m) => m.pct);
  const newOnes: GoalMilestone[] = [];
  for (const threshold of MILESTONE_PCTS) {
    if (pct >= threshold && !reached.includes(threshold)) {
      newOnes.push({
        id: id(),
        goalId: goal.id,
        pct: threshold,
        reachedAt: new Date().toISOString(),
        notified: false,
      });
    }
  }
  return newOnes;
}

/**
 * Apply (or reverse) a transaction's balance effect on the accounts array.
 * - income:  adds to the account balance.
 * - expense: subtracts from the account balance.
 * - transfer: subtracts from fromAccount, adds to toAccount.
 * When reverse=true the effect is inverted (used when deleting or undoing).
 */
function applyTransactionToAccounts(
  tx: Pick<Transaction, "type" | "account" | "fromAccount" | "toAccount" | "amount">,
  accounts: Account[],
  reverse = false,
): Account[] {
  const sign = reverse ? -1 : 1;

  switch (tx.type) {
    case "income":
      return accounts.map((a) =>
        a.name === tx.account
          ? { ...a, balance: a.balance + tx.amount * sign }
          : a,
      );
    case "expense":
      return accounts.map((a) =>
        a.name === tx.account
          ? { ...a, balance: a.balance - tx.amount * sign }
          : a,
      );
    case "transfer":
      return accounts.map((a) => {
        if (a.name === tx.fromAccount)
          return { ...a, balance: a.balance - tx.amount * sign };
        if (a.name === tx.toAccount)
          return { ...a, balance: a.balance + tx.amount * sign };
        return a;
      });
    default:
      return accounts;
  }
}

export const useFinanceStore = create<State>()(
  (set) => ({
    transactions: seedTransactions,
    budgets: seedBudgets,
    goals: seedGoals,
    goalContributions: seedGoalContributions,
    goalMilestones: seedGoalMilestones,
    debts: seedDebts,
    accounts: seedAccounts,

    addTransaction: (t) =>
      set((s) => {
        const newTx: Transaction = { ...t, id: id() };
        return {
          transactions: [newTx, ...s.transactions],
          accounts: applyTransactionToAccounts(newTx, s.accounts),
        };
      }),

    updateTransaction: (tid, t) =>
      set((s) => {
        const oldTx = s.transactions.find((x) => x.id === tid);
        if (!oldTx) return s;
        const merged: Transaction = { ...oldTx, ...t };
        // Reverse the old transaction's effect, then apply the merged effect
        let accounts = applyTransactionToAccounts(oldTx, s.accounts, true);
        accounts = applyTransactionToAccounts(merged, accounts);
        return {
          transactions: s.transactions.map((x) => (x.id === tid ? merged : x)),
          accounts,
        };
      }),

    deleteTransaction: (tid) =>
      set((s) => {
        const tx = s.transactions.find((x) => x.id === tid);
        if (!tx) return s;
        return {
          transactions: s.transactions.filter((x) => x.id !== tid),
          accounts: applyTransactionToAccounts(tx, s.accounts, true),
        };
      }),

    addBudget: (b) => set((s) => ({ budgets: [{ ...b, id: id() }, ...s.budgets] })),
    updateBudget: (bid, b) => set((s) => ({ budgets: s.budgets.map((x) => x.id === bid ? { ...x, ...b } : x) })),
    deleteBudget: (bid) => set((s) => ({ budgets: s.budgets.filter((x) => x.id !== bid) })),

    addGoal: (g) => set((s) => ({ goals: [{ ...g, id: id() }, ...s.goals] })),
    updateGoal: (gid, g) =>
      set((s) => ({
        goals: s.goals.map((x) => (x.id === gid ? { ...x, ...g } : x)),
      })),

    // ── Goal contributions CRUD (auto-syncs goal.saved) ──

    addGoalContribution: (c) =>
      set((s) => {
        const newContrib: GoalContributionEntry = { ...c, id: id() };
        const contributions = [...s.goalContributions, newContrib];
        let goals = recomputeAllGoals(s.goals, contributions);
        const newMilestones = goals.flatMap((g) =>
          checkAndCreateMilestones(g, contributions, s.goalMilestones),
        );
        // Update lastContributionDate immutably for the relevant goal
        goals = goals.map((g) =>
          g.id === c.goalId
            ? { ...g, lastContributionDate: new Date().toISOString() }
            : g
        );

        return {
          goalContributions: contributions,
          goals,
          goalMilestones: [...s.goalMilestones, ...newMilestones],
        };
      }),

    updateGoalContribution: (cid, patch) =>
      set((s) => {
        const contributions = s.goalContributions.map((c) =>
          c.id === cid ? { ...c, ...patch } : c,
        );
        return {
          goalContributions: contributions,
          goals: recomputeAllGoals(s.goals, contributions),
        };
      }),

    deleteGoalContribution: (cid) =>
      set((s) => {
        const contributions = s.goalContributions.filter((c) => c.id !== cid);
        return {
          goalContributions: contributions,
          goals: recomputeAllGoals(s.goals, contributions),
        };
      }),

    // ── Milestone CRUD ──

    addMilestone: (goalId: string, pct: number) =>
      set((s) => ({
        goalMilestones: [
          ...s.goalMilestones,
          { id: id(), goalId, pct, reachedAt: new Date().toISOString(), notified: false },
        ],
      })),

    markMilestoneNotified: (mid: string) =>
      set((s) => ({
        goalMilestones: s.goalMilestones.map((m) => (m.id === mid ? { ...m, notified: true } : m)),
      })),

    deleteGoal: (gid) =>
      set((s) => ({
        goals: s.goals.filter((x) => x.id !== gid),
        goalContributions: s.goalContributions.filter((c) => c.goalId !== gid),
        goalMilestones: s.goalMilestones.filter((m) => m.goalId !== gid),
      })),

    addDebt: (d) => set((s) => ({ debts: [{ ...d, id: id() }, ...s.debts] })),
    updateDebt: (did, d) => set((s) => ({ debts: s.debts.map((x) => x.id === did ? { ...x, ...d } : x) })),
    deleteDebt: (did) => set((s) => ({ debts: s.debts.filter((x) => x.id !== did) })),

    addAccount: (a) => set((s) => ({ accounts: [{ ...a, id: id() }, ...s.accounts] })),
    updateAccount: (aid, a) => set((s) => ({ accounts: s.accounts.map((x) => x.id === aid ? { ...x, ...a } : x) })),
    deleteAccount: (aid) => set((s) => ({ accounts: s.accounts.filter((x) => x.id !== aid) })),

    archiveBudget: (bid) =>
      set((s) => ({
        budgets: s.budgets.map((b) => {
          if (b.id !== bid) return b;
          const periodKey = getBudgetPeriodKey(b);
          const entry = { periodKey, spent: b.spent, amount: b.amount, date: new Date().toISOString() };
          return { ...b, spent: 0, history: [...(b.history ?? []), entry] };
        }),
      })),

    resetDemoData: () =>
      set({
        transactions: [...seedTransactions],
        budgets: [...seedBudgets],
        goals: [...seedGoals],
        goalContributions: [...seedGoalContributions],
        goalMilestones: [...seedGoalMilestones],
        debts: [...seedDebts],
        accounts: [...seedAccounts],
      }),

    clearAllData: () =>
      set({
        transactions: [],
        budgets: [],
        goals: [],
        goalContributions: [],
        goalMilestones: [],
        debts: [],
        accounts: [],
      }),

    restoreData: (data: {
      transactions: Transaction[];
      budgets: Budget[];
      goals: SavingsGoal[];
      goalContributions: GoalContributionEntry[];
      goalMilestones: GoalMilestone[];
      debts: Debt[];
      accounts: Account[];
    }) =>
      set({
        transactions: Array.isArray(data?.transactions) ? data.transactions : [],
        budgets: Array.isArray(data?.budgets) ? data.budgets : [],
        goals: Array.isArray(data?.goals) ? data.goals : [],
        goalContributions: Array.isArray(data?.goalContributions) ? data.goalContributions : [],
        goalMilestones: Array.isArray(data?.goalMilestones) ? data.goalMilestones : [],
        debts: Array.isArray(data?.debts) ? data.debts : [],
        accounts: Array.isArray(data?.accounts) ? data.accounts : [],
      }),
  }),
);

// ── Budget status types ───────────────────────────────────────────────────────

export type BudgetStatusValue = "on-track" | "near-limit" | "exceeded";
export interface BudgetStatusInfo {
  label: "On Track" | "Near Limit" | "Exceeded";
  tone: "success" | "warning" | "destructive";
  value: BudgetStatusValue;
}

// ── Budget selectors ──────────────────────────────────────────────────────────

/** Amount remaining before the budget is exhausted (can be negative if overspent). */
export function getBudgetRemaining(budget: Budget) {
  return budget.amount - budget.spent;
}

/** Percentage of the budget that has been spent (0–100+, can exceed 100). */
export function getBudgetPercentSpent(budget: Budget) {
  return budget.amount === 0 ? 0 : (budget.spent / budget.amount) * 100;
}

/** How much the budget has been exceeded by (0 if not overspent). */
export function getBudgetOverspent(budget: Budget) {
  return Math.max(budget.spent - budget.amount, 0);
}

/** Determine the budget status from the percentage spent. */
export function getBudgetStatus(budget: Budget): BudgetStatusInfo {
  const pct = getBudgetPercentSpent(budget);
  if (pct > 100) return { label: "Exceeded", tone: "destructive", value: "exceeded" };
  if (pct >= 80) return { label: "Near Limit", tone: "warning", value: "near-limit" };
  return { label: "On Track", tone: "success", value: "on-track" };
}

export interface BudgetProgressInfo {
  spent: number;
  amount: number;
  remaining: number;
  percentage: number;
  overspent: number;
  status: BudgetStatusInfo;
}

export function getBudgetProgress(budget: Budget): BudgetProgressInfo {
  return {
    spent: budget.spent,
    amount: budget.amount,
    remaining: getBudgetRemaining(budget),
    percentage: getBudgetPercentSpent(budget),
    overspent: getBudgetOverspent(budget),
    status: getBudgetStatus(budget),
  };
}

/** Generate a period key for a budget (e.g. "2026-06" for monthly, "2026-W25" for weekly, "2026" for yearly). */
export function getBudgetPeriodKey(budget: Budget): string {
  const now = new Date();
  const year = now.getFullYear();
  switch (budget.period) {
    case "weekly": {
      const start = new Date(now.getFullYear(), 0, 1);
      const diff = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return `${year}-W${String(diff).padStart(2, "0")}`;
    }
    case "yearly":
      return String(year);
    default:
      return `${year}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
}

/** Return the previous period's history entry, if any. */
export function getBudgetPreviousPeriod(budget: Budget): Budget["history"][number] | undefined {
  const history = budget.history;
  if (!history || history.length === 0) return undefined;
  return history[history.length - 1];
}

/** Percentage spent in the previous period (0 if no history). */
export function getBudgetPreviousPercent(budget: Budget): number {
  const prev = getBudgetPreviousPeriod(budget);
  if (!prev || prev.amount === 0) return 0;
  return (prev.spent / prev.amount) * 100;
}

/** Trend direction compared to the previous period: "improvement", "decline", or "stable". */
export type BudgetTrend = "improvement" | "decline" | "stable";

export function getBudgetTrend(budget: Budget): BudgetTrend {
  const current = getBudgetPercentSpent(budget);
  const previous = getBudgetPreviousPercent(budget);
  const diff = current - previous;
  if (Math.abs(diff) < 1) return "stable";
  return diff < 0 ? "improvement" : "decline";
}

/** Daily remaining allowance for the rest of the period. */
export function getBudgetDailyAllowance(budget: Budget) {
  const remaining = getBudgetRemaining(budget);
  if (remaining <= 0) return 0;

  // Custom date range: compute exact days between start and end
  if (budget.startDate && budget.endDate) {
    const start = new Date(budget.startDate);
    const end = new Date(budget.endDate);
    const diffMs = end.getTime() - start.getTime();
    const daysInPeriod = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 1);
    return remaining / daysInPeriod;
  }

  // Fall back to period-based calculation
  const daysInPeriod = budget.period === "weekly" ? 7 : budget.period === "yearly" ? 365 : 30;
  return remaining / daysInPeriod;
}

// ── Shared finance selectors ──────────────────────────────────────────────────
// These replace duplicate inline calculations in Dashboard, Reports, and services.

/** Total balance across all accounts. */
export function getTotalBalance(accounts: Account[]) {
  return accounts.reduce((sum, account) => sum + account.balance, 0);
}

/** Current balance — alias for `getTotalBalance`. Semantic clarity in account context. */
export function getCurrentBalance(accounts: Account[]) {
  return getTotalBalance(accounts);
}

/** Available balance — total balance minus current-month expenses. */
export function getAvailableBalance(accounts: Account[], transactions: Transaction[]) {
  const total = getTotalBalance(accounts);
  const { expenses } = getMonthlySummary(transactions);
  return total - expenses;
}

/** Total income across all transactions. */
export function getTotalIncome(transactions: Transaction[]) {
  return transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Total expenses across all transactions. */
export function getTotalExpenses(transactions: Transaction[]) {
  return transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Net cash flow — total income minus total expenses. */
export function getNetCashFlow(transactions: Transaction[]) {
  return getTotalIncome(transactions) - getTotalExpenses(transactions);
}

/** Date string of the most recent transaction, or null if there are none. */
export function getLastTransactionDate(transactions: Transaction[]): string | null {
  if (transactions.length === 0) return null;
  return transactions.reduce((latest, t) => (t.date > latest ? t.date : latest), transactions[0].date);
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
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthTxs = transactions.filter((t) => new Date(t.date) >= monthStart);

  return accounts.map((account) => {
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
  if (!transaction.fromAccount?.trim()) errors.push("Source account is required");
  if (!transaction.toAccount?.trim()) errors.push("Destination account is required");
  if (transaction.fromAccount && transaction.toAccount && transaction.fromAccount === transaction.toAccount)
    errors.push("Cannot transfer to the same account");
  if (transaction.fromAccount && !accounts.some((a) => a.name === transaction.fromAccount))
    errors.push(`Source account "${transaction.fromAccount}" not found`);
  if (transaction.toAccount && !accounts.some((a) => a.name === transaction.toAccount))
    errors.push(`Destination account "${transaction.toAccount}" not found`);
  return { valid: errors.length === 0, errors };
}

/** All transfer transactions sorted by date descending. */
export function getTransferHistory(transactions: Transaction[]): Transaction[] {
  return transactions
    .filter((t) => t.type === "transfer")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Net amount transferred into an account (incoming - outgoing, 0 if no transfers). */
export function getNetTransferBalance(accountName: string, transactions: Transaction[]): number {
  let net = 0;
  for (const t of transactions) {
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
  const now = new Date();
  const buckets: { key: string; label: string; start: Date }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    buckets.push({ key: label, label, start: d });
  }

  return accounts.map((account) => {
    let runningBalance = account.openingBalance;
    // Compute balance at each bucket boundary from transactions before that point
    const sortedTxs = transactions
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
}

/** The most recent transactions for a given account, formatted as a timeline. */
export function getAccountActivityTimeline(
  accountName: string,
  transactions: Transaction[],
  limit = 10,
): ActivityTimelineEntry[] {
  return transactions
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
  activityLevel: "high" | "medium" | "low" | "inactive";
  monthlyTransactionsAvg: number;
  monthsOfExpensesCovered: number;
  trend: "up" | "down" | "stable";
}

/** Health indicators per account. */
export function getAccountsHealth(
  accounts: Account[],
  transactions: Transaction[],
): AccountHealth[] {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const recentTxs = transactions.filter((t) => new Date(t.date) >= threeMonthsAgo);

  return accounts.map((account) => {
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
    const growth = account.openingBalance > 0
      ? ((account.balance - account.openingBalance) / account.openingBalance) * 100
      : account.balance > 0 ? 100 : 0;

    const incomeExpenseRatio = netExpenses > 0 ? netIncome / netExpenses : netIncome > 0 ? Infinity : 1;

    // Activity level based on monthly transaction count
    const monthsInRange = 3;
    const transactionCount = accountTxs.length;
    const monthlyTransactionsAvg = transactionCount / monthsInRange;
    const activityLevel: AccountHealth["activityLevel"] =
      monthlyTransactionsAvg >= 8 ? "high"
        : monthlyTransactionsAvg >= 3 ? "medium"
          : monthlyTransactionsAvg >= 1 ? "low"
            : "inactive";

    // Months of expenses covered by current balance
    const monthlyExpenseAvg = totalExpenses / monthsInRange;
    const monthsOfExpensesCovered = monthlyExpenseAvg > 0 ? account.balance / monthlyExpenseAvg : Infinity;

    // Trend direction based on recent net vs older net
    const olderTxs = transactions.filter((t) => {
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
  return accounts.filter((a) => types.includes(a.type));
}

/** Income, expenses, and savings for the current month-to-date. */
export function getMonthlySummary(transactions: Transaction[], referenceDate = new Date()) {
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const monthTransactions = transactions.filter((transaction) => new Date(transaction.date) >= monthStart);
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
  transactions.forEach((t) => {
    const d = new Date(t.date);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    const entry = map.get(key);
    if (entry) {
      if (t.type === "income") entry.income += t.amount;
      else entry.expenses += t.amount;
      entry.net = entry.income - entry.expenses;
    }
  });
  return Array.from(map.values());
}

export interface CategoryBreakdownEntry {
  name: string;
  value: number;
}

/** Aggregate expenses by category, sorted descending. */
export function getCategoryBreakdown(transactions: Transaction[]): CategoryBreakdownEntry[] {
  const map = new Map<string, number>();
  transactions.filter((t) => t.type === "expense").forEach((t) => {
    map.set(t.category, (map.get(t.category) || 0) + t.amount);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/** Derive cash flow (net) from a monthly chart. */
export function getCashFlow(chart: MonthlyChartEntry[]): { month: string; cashFlow: number }[] {
  return chart.map((m) => ({ month: m.month, cashFlow: m.income - m.expenses }));
}

// ── Goal selectors ───────────────────────────────────────────────────────────

export interface GoalProgressInfo {
  /** Amount saved so far (from the goal). */
  saved: number;
  /** Target amount. */
  target: number;
  /** Number of contributions recorded. */
  contributionCount: number;
  /** Remaining amount needed to reach the target. */
  remaining: number;
  /** Percentage completed (0–100). */
  pct: number;
  /** Number of days until the deadline (0 if overdue). */
  daysRemaining: number;
  /** Average daily contribution rate based on contributions history (0 if no data). */
  dailyRate: number;
  /** Average monthly contribution rate (dailyRate × 30). */
  monthlyRate: number;
  /** Estimated completion date based on current daily rate, or null if rate is 0. */
  estimatedCompletion: string | null;
  /** Monthly amount needed from now until the deadline to hit the target (0 if overdue). */
  monthlyNeeded: number;
  /** Whether the goal is on track to be completed by the deadline based on the current rate. */
  onTrack: boolean;
}

/** Remaining amount needed to reach the target. */
export function getGoalRemaining(goal: SavingsGoal) {
  return Math.max(goal.target - goal.saved, 0);
}

/** Percentage completed (0–100, capped). */
export function getGoalPercent(goal: SavingsGoal) {
  return goal.target === 0 ? 0 : Math.min((goal.saved / goal.target) * 100, 100);
}

/** Days until the deadline (0 if already past). */
export function getGoalDaysRemaining(goal: SavingsGoal) {
  const now = new Date();
  const deadline = new Date(goal.deadline);
  const diff = deadline.getTime() - now.getTime();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

/**
 * Average daily contribution rate based on the contributions for this goal.
 * Uses the goal's creation date as the effective start.
 */
export function getGoalContributionRate(goal: SavingsGoal, contributions: GoalContributionEntry[]): number {
  const goalContribs = contributions.filter((c) => c.goalId === goal.id);
  if (goalContribs.length === 0) return 0;

  const now = new Date().getTime();
  const createdAt = new Date(goal.createdAt).getTime();
  const oldestContrib = goalContribs.reduce(
    (earliest, c) => Math.min(earliest, new Date(c.date).getTime()),
    createdAt,
  );
  const effectiveStart = Math.min(createdAt, oldestContrib);
  const daysElapsed = Math.max((now - effectiveStart) / (1000 * 60 * 60 * 24), 1);

  const total = goalContribs.reduce((sum, c) => sum + c.amount, 0);
  return total / daysElapsed;
}

/**
 * Estimated completion date based on the current daily contribution rate.
 * Returns null if the rate is zero or the goal is already met.
 */
export function getGoalEstimatedCompletion(goal: SavingsGoal, rate: number): string | null {
  const remaining = getGoalRemaining(goal);
  if (remaining <= 0) return new Date().toISOString(); // Already completed
  if (rate <= 0) return null;

  const daysNeeded = Math.ceil(remaining / rate);
  const estimated = new Date();
  estimated.setDate(estimated.getDate() + daysNeeded);
  return estimated.toISOString();
}

/** Monthly amount needed from now until the deadline to hit the target (0 if overdue). */
export function getGoalMonthlyNeeded(goal: SavingsGoal): number {
  const days = getGoalDaysRemaining(goal);
  if (days <= 0) return 0;
  const remaining = getGoalRemaining(goal);
  const months = Math.max(days / 30, 1 / 30);
  return remaining / months;
}

// ── Aggregate savings selectors ──────────────────────────────────────────

/** Total amount saved across all goals. */
export function getTotalSaved(goals: SavingsGoal[]) {
  return goals.reduce((sum, g) => sum + g.saved, 0);
}

/** Total target amount across all goals. */
export function getTotalTarget(goals: SavingsGoal[]) {
  return goals.reduce((sum, g) => sum + g.target, 0);
}

/** Combined savings progress across all goals. */
export function getTotalSavingsProgress(goals: SavingsGoal[]) {
  const saved = getTotalSaved(goals);
  const target = getTotalTarget(goals);
  return {
    saved,
    target,
    remaining: Math.max(target - saved, 0),
    pct: target === 0 ? 0 : Math.min((saved / target) * 100, 100),
  };
}

export interface MonthlySavingsEntry {
  month: string;
  contributions: number;
}

/** Aggregate goal contributions by month for charting. */
export function getMonthlyGoalContributions(
  goalContributions: GoalContributionEntry[],
  months = 6,
): MonthlySavingsEntry[] {
  const map = new Map<string, number>();
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    map.set(key, 0);
  }
  goalContributions.forEach((c) => {
    const d = new Date(c.date);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    if (map.has(key)) {
      map.set(key, map.get(key)! + c.amount);
    }
  });
  return Array.from(map.entries()).map(([month, contributions]) => ({ month, contributions }));
}

// ── Savings analytics selectors ──────────────────────────────────────────

export interface ContributionFrequency {
  period: string;
  count: number;
  total: number;
}

/** Group contributions into weekly/monthly buckets and return frequency stats. */
export function getContributionFrequency(
  goalContributions: GoalContributionEntry[],
): { weekly: ContributionFrequency[]; monthly: ContributionFrequency[]; avgPerWeek: number; avgPerMonth: number } {
  const now = new Date();

  // Weekly buckets: last 8 weeks
  const weeklyMap = new Map<string, { count: number; total: number }>();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay() - i * 7);
    const key = d.toLocaleString("en-US", { month: "short", day: "numeric" });
    weeklyMap.set(key, { count: 0, total: 0 });
  }
  goalContributions.forEach((c) => {
    const d = new Date(c.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toLocaleString("en-US", { month: "short", day: "numeric" });
    if (weeklyMap.has(key)) {
      const prev = weeklyMap.get(key)!;
      weeklyMap.set(key, { count: prev.count + 1, total: prev.total + c.amount });
    }
  });
  const weekly = Array.from(weeklyMap.entries()).map(([period, v]) => ({ period, ...v }));

  // Monthly buckets: last 6 months
  const monthlyMap = new Map<string, { count: number; total: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    monthlyMap.set(key, { count: 0, total: 0 });
  }
  goalContributions.forEach((c) => {
    const d = new Date(c.date);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    if (monthlyMap.has(key)) {
      const prev = monthlyMap.get(key)!;
      monthlyMap.set(key, { count: prev.count + 1, total: prev.total + c.amount });
    }
  });
  const monthly = Array.from(monthlyMap.entries()).map(([period, v]) => ({ period, ...v }));

  const weeksWithData = weekly.filter((w) => w.count > 0);
  const monthsWithData = monthly.filter((m) => m.count > 0);
  const avgPerWeek = weeksWithData.length > 0 ? weeksWithData.reduce((s, w) => s + w.total, 0) / weeksWithData.length : 0;
  const avgPerMonth = monthsWithData.length > 0 ? monthsWithData.reduce((s, m) => s + m.total, 0) / monthsWithData.length : 0;

  return { weekly, monthly, avgPerWeek, avgPerMonth };
}

export interface AverageMonthlySavings {
  totalContributions: number;
  monthsActive: number;
  averagePerMonth: number;
  bestMonth: { month: string; amount: number } | null;
  currentMonth: number;
}

/** Compute average monthly savings based on contribution history. */
export function getAverageMonthlySavings(
  goalContributions: GoalContributionEntry[],
): AverageMonthlySavings {
  if (goalContributions.length === 0) {
    return { totalContributions: 0, monthsActive: 0, averagePerMonth: 0, bestMonth: null, currentMonth: 0 };
  }

  // Determine active months range
  const dates = goalContributions.map((c) => new Date(c.date).getTime());
  const firstDate = new Date(Math.min(...dates));
  const now = new Date();
  const totalMonths = Math.max(
    1,
    (now.getFullYear() - firstDate.getFullYear()) * 12 + now.getMonth() - firstDate.getMonth() + 1,
  );

  // Group by month
  const monthMap = new Map<string, number>();
  goalContributions.forEach((c) => {
    const d = new Date(c.date);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    monthMap.set(key, (monthMap.get(key) || 0) + c.amount);
  });

  const totalContributions = goalContributions.reduce((s, c) => s + c.amount, 0);
  const averagePerMonth = totalContributions / totalMonths;

  let bestMonth: { month: string; amount: number } | null = null;
  for (const [month, amount] of monthMap) {
    if (!bestMonth || amount > bestMonth.amount) bestMonth = { month, amount };
  }

  const currentMonthKey = now.toLocaleString("en-US", { month: "short", year: "2-digit" });
  const currentMonth = monthMap.get(currentMonthKey) || 0;

  return { totalContributions, monthsActive: totalMonths, averagePerMonth, bestMonth, currentMonth };
}

export interface CompletionForecast {
  goalId: string;
  goalName: string;
  saved: number;
  target: number;
  remaining: number;
  monthlyRate: number;
  estimatedDate: string | null;
  monthsToCompletion: number | null;
  onTrack: boolean;
  deadline: string;
}

/** Per-goal completion forecast. */
export function getCompletionForecast(
  goals: SavingsGoal[],
  goalContributions: GoalContributionEntry[],
): CompletionForecast[] {
  return goals.map((g) => {
    const progress = getGoalProgress(g, goalContributions);
    const estDate = progress.estimatedCompletion;
    const monthsToCompletion = estDate
      ? Math.max(0, (new Date(estDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
      : null;
    return {
      goalId: g.id,
      goalName: g.name,
      saved: progress.saved,
      target: progress.target,
      remaining: progress.remaining,
      monthlyRate: progress.monthlyRate,
      estimatedDate: estDate,
      monthsToCompletion: monthsToCompletion !== null ? Math.ceil(monthsToCompletion) : null,
      onTrack: progress.onTrack,
      deadline: g.deadline,
    };
  });
}

export interface OverallTimeline {
  totalSaved: number;
  totalTarget: number;
  totalRemaining: number;
  combinedMonthlyRate: number;
  estimatedMonths: number | null;
  estimatedDate: string | null;
  forecastMonths: { month: string; cumulative: number; target: number }[];
}

/** Overall projected completion timeline across all goals. */
export function getOverallCompletionTimeline(
  goals: SavingsGoal[],
  goalContributions: GoalContributionEntry[],
): OverallTimeline {
  const totalSaved = getTotalSaved(goals);
  const totalTarget = getTotalTarget(goals);
  const totalRemaining = Math.max(totalTarget - totalSaved, 0);

  // Combined monthly rate from all goals with data
  let combinedMonthlyRate = 0;
  let goalsWithRate = 0;
  for (const g of goals) {
    const progress = getGoalProgress(g, goalContributions);
    if (progress.monthlyRate > 0) {
      combinedMonthlyRate += progress.monthlyRate;
      goalsWithRate++;
    }
  }

  const estimatedMonths =
    combinedMonthlyRate > 0 && totalRemaining > 0
      ? Math.ceil(totalRemaining / combinedMonthlyRate)
      : null;

  const estimatedDate =
    estimatedMonths !== null
      ? new Date(Date.now() + estimatedMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  // Build forecast projection (monthly cumulative chart data)
  const forecastMonths: { month: string; cumulative: number; target: number }[] = [];
  if (combinedMonthlyRate > 0) {
    const projectionMonths = Math.min(estimatedMonths ?? 12, 24);
    let cumulative = totalSaved;
    const now = new Date();
    for (let i = 1; i <= projectionMonths; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      cumulative += combinedMonthlyRate;
      forecastMonths.push({
        month: key,
        cumulative: Math.min(cumulative, totalTarget),
        target: totalTarget,
      });
    }
  }

  return {
    totalSaved,
    totalTarget,
    totalRemaining,
    combinedMonthlyRate,
    estimatedMonths,
    estimatedDate,
    forecastMonths,
  };
}

/** Compute the full goal progress info by composing the selectors above. */
export function getGoalProgress(goal: SavingsGoal, contributions: GoalContributionEntry[]): GoalProgressInfo {
  const saved = goal.saved;
  const target = goal.target;
  const remaining = getGoalRemaining(goal);
  const pct = getGoalPercent(goal);
  const contributionCount = contributions.filter((c) => c.goalId === goal.id).length;
  const daysRemaining = getGoalDaysRemaining(goal);
  const dailyRate = getGoalContributionRate(goal, contributions);
  const monthlyRate = dailyRate * 30;
  const estimatedCompletion = getGoalEstimatedCompletion(goal, dailyRate);
  const monthlyNeeded = getGoalMonthlyNeeded(goal);
  const onTrack = dailyRate > 0 && estimatedCompletion !== null
    ? new Date(estimatedCompletion).getTime() <= new Date(goal.deadline).getTime()
    : false;

  return {
    saved, target, contributionCount, remaining, pct, daysRemaining,
    dailyRate, monthlyRate, estimatedCompletion, monthlyNeeded, onTrack,
  };
}
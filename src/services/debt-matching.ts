import type { Debt, Transaction } from "@/types";

export function getDebtSafeArray<T>(arr: T[] | null | undefined): T[] {
  return Array.isArray(arr) ? arr : [];
}

export interface DebtMetrics {
  amountPaid: number;
  remainingBalance: number;
  percentagePaid: number;
  paymentCount: number;
  monthlyPaid: number;
  totalInterestPaid: number;
  daysUntilDue: number;
  isPaidOff: boolean;
  isOverdue: boolean;
}

export type DebtStatusValue = "paid-off" | "on-track" | "behind" | "critical" | "overdue";

export interface DebtStatusInfo {
  label: string;
  value: DebtStatusValue;
}

export const debtStatusColors: Record<DebtStatusValue, string> = {
  "paid-off": "hsl(142 71% 45%)",
  "on-track": "hsl(217 91% 60%)",
  behind: "hsl(38 92% 50%)",
  critical: "hsl(0 72% 55%)",
  overdue: "hsl(0 84% 35%)",
};

export const debtStatusToneBg: Record<DebtStatusValue, string> = {
  "paid-off": "bg-success/15 text-success",
  "on-track": "bg-blue-500/15 text-blue-500",
  behind: "bg-amber-500/15 text-amber-500",
  critical: "bg-destructive/15 text-destructive",
  overdue: "bg-destructive/30 text-destructive",
};

export function getDebtStatus(pct: number, isPaidOff: boolean, isOverdue: boolean): DebtStatusInfo {
  if (isPaidOff) return { label: "Paid Off", value: "paid-off" };
  if (isOverdue) return { label: "Overdue", value: "overdue" };
  if (pct >= 90) return { label: "Almost there", value: "behind" };
  if (pct >= 50) return { label: "Halfway", value: "behind" };
  if (pct >= 10) return { label: "Paying down", value: "on-track" };
  return { label: "Getting started", value: "critical" };
}

export function getMatchingDebtTransactions(
  debt: Debt,
  transactions: Transaction[],
): Transaction[] {
  const startMs = new Date(debt.startDate).getTime();
  return transactions.filter((t) => {
    // Must be explicitly linked to this debt
    if (t.debtId !== debt.id) return false;

    // Date range check
    const txMs = new Date(t.date).getTime();
    if (txMs < startMs) return false;

    // Type checks
    if (t.type === "income") return false;
    if (t.type === "transfer" && !debt.includeTransfers) return false;

    // Filter validations (additional constraints, not auto-assignment)
    const cats = getDebtSafeArray(debt.categories);
    if (cats.length > 0 && !cats.includes(t.category)) return false;

    const accts = getDebtSafeArray(debt.accounts);
    if (accts.length > 0 && !accts.includes(t.account) && !accts.includes(t.fromAccount ?? "") && !accts.includes(t.toAccount ?? "")) return false;

    const wallets = getDebtSafeArray(debt.wallets);
    if (wallets.length > 0 && !wallets.includes(t.account) && !wallets.includes(t.toAccount ?? "")) return false;

    const tags = getDebtSafeArray(debt.tags);
    if (tags.length > 0) {
      const txTags = getDebtSafeArray(t.tags);
      if (!txTags.some((tag) => tags.includes(tag))) return false;
    }

    return true;
  });
}

export function calculateDebtMetrics(
  debt: Debt,
  transactions: Transaction[],
  referenceDate: Date = new Date(),
): DebtMetrics {
  const matching = getMatchingDebtTransactions(debt, transactions);

  const amountPaid = matching.reduce((sum, t) => sum + t.amount, 0);
  const remainingBalance = Math.max(debt.originalAmount - amountPaid, 0);
  const percentagePaid = debt.originalAmount > 0 ? (amountPaid / debt.originalAmount) * 100 : 0;
  const paymentCount = matching.length;

  const refMs = referenceDate.getTime();
  const startMs = new Date(debt.startDate).getTime();
  const daysElapsed = Math.max(1, Math.ceil((refMs - startMs) / (1000 * 60 * 60 * 24)));
  const monthsElapsed = Math.max(1, daysElapsed / 30);
  const monthlyPaid = amountPaid / monthsElapsed;

  const dueMs = new Date(debt.dueDate).getTime();
  const daysUntilDue = Math.ceil((dueMs - refMs) / (1000 * 60 * 60 * 24));
  const isPaidOff = remainingBalance <= 0;
  const isOverdue = !isPaidOff && refMs > dueMs;

  return {
    amountPaid,
    remainingBalance,
    percentagePaid,
    paymentCount,
    monthlyPaid,
    totalInterestPaid: 0,
    daysUntilDue,
    isPaidOff,
    isOverdue,
  };
}

export function calculateDebtTotals(
  debts: Debt[],
  transactions: Transaction[],
): { totalOriginal: number; totalPaid: number; totalRemaining: number; totalMin: number; count: number } {
  let totalOriginal = 0;
  let totalPaid = 0;
  let totalMin = 0;
  for (const d of debts) {
    const m = calculateDebtMetrics(d, transactions);
    totalOriginal += d.originalAmount;
    totalPaid += m.amountPaid;
    totalMin += d.minimumPayment;
  }
  return {
    totalOriginal,
    totalPaid,
    totalRemaining: totalOriginal - totalPaid,
    totalMin,
    count: debts.length,
  };
}

export function migrateDebt(old: Record<string, unknown>): Debt {
  return {
    id: String(old.id ?? ""),
    name: String(old.name ?? ""),
    lender: String(old.lender ?? ""),
    originalAmount: Number(old.originalAmount ?? old.balance ?? 0),
    interestRate: Number(old.interestRate ?? 0),
    debtType: (old.debtType as Debt["debtType"]) || "Loan",
    repaymentType: (old.repaymentType as Debt["repaymentType"]) || "Fixed",
    minimumPayment: Number(old.minimumPayment ?? old.minPayment ?? 0),
    dueDate: String(old.dueDate ?? ""),
    startDate: String(old.startDate ?? old.createdAt ?? new Date().toISOString()),
    categories: Array.isArray(old.categories) ? old.categories : [],
    accounts: Array.isArray(old.accounts) ? old.accounts : [],
    wallets: Array.isArray(old.wallets) ? old.wallets : [],
    tags: Array.isArray(old.tags) ? old.tags : [],
    color: String(old.color ?? "#ef4444"),
    icon: String(old.icon ?? "credit-card"),
    notes: String(old.notes ?? ""),
    includeTransfers: old.includeTransfers === true,
    createdAt: String(old.createdAt ?? new Date().toISOString()),
    updatedAt: String(old.updatedAt ?? new Date().toISOString()),
  };
}

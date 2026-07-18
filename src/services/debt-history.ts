import type { Debt, Transaction } from "@/types";
import { calculateDebtMetrics, getMatchingDebtTransactions } from "./debt-matching";
import { calculateDebtInsights } from "./debt-insights";

export interface DebtHistoryEntry {
  id: string;
  debtId: string;
  debtName: string;
  lender: string;
  originalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  totalInterestPaid: number;
  interestRate: number;
  percentagePaid: number;
  paymentCount: number;
  averagePaymentSize: number;
  largestPayment: number;
  monthsToPayoff: number;
  daysToPayoff: number;
  payoffDate: string;
  archivedAt: string;
  debtType: string;
  repaymentType: string;
  minimumPayment: number;
}

export function archiveDebtMetrics(debt: Debt, transactions: Transaction[]): DebtHistoryEntry {
  const metrics = calculateDebtMetrics(debt, transactions);
  const insights = calculateDebtInsights(debt, transactions);

  const matching = getMatchingDebtTransactions(debt, transactions)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const startMs = new Date(debt.startDate).getTime();
  const nowMs = Date.now();
  const totalDays = Math.max(1, Math.ceil((nowMs - startMs) / (1000 * 60 * 60 * 24)));

  const payoffDate = matching.length > 0
    ? matching[matching.length - 1].date
    : new Date().toISOString();

  return {
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10),
    debtId: debt.id,
    debtName: debt.name,
    lender: debt.lender,
    originalAmount: debt.originalAmount,
    amountPaid: metrics.amountPaid,
    remainingBalance: metrics.remainingBalance,
    totalInterestPaid: insights.totalInterestEstimate,
    interestRate: debt.interestRate,
    percentagePaid: metrics.percentagePaid,
    paymentCount: metrics.paymentCount,
    averagePaymentSize: insights.averagePaymentSize,
    largestPayment: insights.largestPayment,
    monthsToPayoff: Math.ceil(totalDays / 30),
    daysToPayoff: totalDays,
    payoffDate,
    archivedAt: new Date().toISOString(),
    debtType: debt.debtType,
    repaymentType: debt.repaymentType,
    minimumPayment: debt.minimumPayment,
  };
}

export function getDebtPaymentMilestones(
  debt: Debt,
  transactions: Transaction[],
): { pct: number; label: string; achieved: boolean; date: string | null }[] {
  const metrics = calculateDebtMetrics(debt, transactions);
  const matching = getMatchingDebtTransactions(debt, transactions)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const milestones = [25, 50, 75, 90, 100].map((pct) => {
    const target = debt.originalAmount * (pct / 100);
    let cumulative = 0;
    let achievedDate: string | null = null;
    for (const t of matching) {
      cumulative += t.amount;
      if (cumulative >= target) {
        achievedDate = t.date;
        break;
      }
    }
    return {
      pct,
      label: pct === 100 ? "Paid Off" : `${pct}% Paid`,
      achieved: metrics.percentagePaid >= pct,
      date: achievedDate,
    };
  });

  return milestones;
}

export interface DebtPeriodSummary {
  year: number;
  month: number;
  monthLabel: string;
  amountPaid: number;
  paymentCount: number;
  runningTotal: number;
}

export function getDebtMonthlySummary(
  debt: Debt,
  transactions: Transaction[],
  months = 12,
): DebtPeriodSummary[] {
  const matching = getMatchingDebtTransactions(debt, transactions)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const now = new Date();
  const result: DebtPeriodSummary[] = [];
  let runningTotal = 0;

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthTxs = matching.filter((t) => {
      const td = new Date(t.date);
      return td >= d && td < monthEnd;
    });
    const amountPaid = monthTxs.reduce((s, t) => s + t.amount, 0);
    runningTotal += amountPaid;
    result.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      monthLabel: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
      amountPaid,
      paymentCount: monthTxs.length,
      runningTotal,
    });
  }

  return result;
}

import type { Debt, Transaction } from "@/types";
import { getMatchingDebtTransactions, calculateDebtMetrics } from "./debt-matching";

export interface DebtInsights {
  totalInterestEstimate: number;
  averageMonthlyRepayment: number;
  averagePaymentSize: number;
  largestPayment: number;
  smallestPayment: number;
  paymentFrequency: number;
  remainingBalance: number;
  estimatedPayoffDate: string | null;
  debtFreeForecast: number | null;
  payoffVelocity: number;
  debtHealthScore: number;
}

export interface PaymentTrendPoint {
  month: string;
  paid: number;
  runningTotal: number;
}

export interface OutstandingTrendPoint {
  month: string;
  outstanding: number;
}

export interface DebtDistribution {
  name: string;
  originalAmount: number;
  remainingBalance: number;
  amountPaid: number;
  percentagePaid: number;
}

export interface PayoffForecast {
  monthsRemaining: number;
  estimatedPayoffDate: string | null;
  totalRemaining: number;
  monthlyRequired: number;
  onTrack: boolean;
}

export interface DebtUtilization {
  totalOriginal: number;
  totalRemaining: number;
  totalPaid: number;
  utilizationRate: number;
  payoffProgress: number;
}

export interface PaymentCalendarEntry {
  date: string;
  amount: number;
  description: string;
  runningBalance: number;
}

export interface DebtAnalytics {
  insights: DebtInsights;
  paymentTrend: PaymentTrendPoint[];
  outstandingTrend: OutstandingTrendPoint[];
  paymentDistribution: { name: string; value: number }[];
  payoffForecast: PayoffForecast;
  debtDistribution: DebtDistribution[];
  utilization: DebtUtilization;
  paymentCalendar: PaymentCalendarEntry[];
  largestPayments: PaymentCalendarEntry[];
}

export function calculateDebtInsights(
  debt: Debt,
  transactions: Transaction[],
  referenceDate: Date = new Date(),
): DebtInsights {
  const matching = getMatchingDebtTransactions(debt, transactions);
  const metrics = calculateDebtMetrics(debt, transactions, referenceDate);

  const payments = matching.filter((t) => t.amount > 0);
  const totalPayments = payments.reduce((s, t) => s + t.amount, 0);
  const paymentCount = payments.length;

  const startMs = new Date(debt.startDate).getTime();
  const refMs = referenceDate.getTime();
  const monthsElapsed = Math.max(1, (refMs - startMs) / (1000 * 60 * 60 * 24 * 30));

  const sortedByAmount = [...payments].sort((a, b) => b.amount - a.amount);
  const sortedByDate = [...payments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const averageMonthlyRepayment = totalPayments / monthsElapsed;
  const averagePaymentSize = paymentCount > 0 ? totalPayments / paymentCount : 0;
  const largestPayment = sortedByAmount[0]?.amount ?? 0;
  const smallestPayment = paymentCount > 0 ? sortedByAmount[sortedByAmount.length - 1]?.amount ?? 0 : 0;
  const paymentFrequency = monthsElapsed > 0 ? paymentCount / monthsElapsed : 0;

  const balance = debt.originalAmount - totalPayments;
  const remainingBalance = Math.max(balance, 0);
  const monthlyRequired = debt.minimumPayment > 0 ? debt.minimumPayment : averageMonthlyRepayment;

  let estimatedPayoffDate: string | null = null;
  let debtFreeForecast: number | null = null;
  if (monthlyRequired > 0 && remainingBalance > 0) {
    const monthsToPayoff = Math.ceil(remainingBalance / monthlyRequired);
    debtFreeForecast = monthsToPayoff;
    const payoffDate = new Date(referenceDate);
    payoffDate.setMonth(payoffDate.getMonth() + monthsToPayoff);
    estimatedPayoffDate = payoffDate.toISOString();
  } else if (remainingBalance <= 0) {
    estimatedPayoffDate = referenceDate.toISOString();
    debtFreeForecast = 0;
  }

  const principalPortion = debt.originalAmount > 0 ? totalPayments / debt.originalAmount : 0;
  const totalInterestEstimate = debt.interestRate > 0 && remainingBalance > 0
    ? Math.round(remainingBalance * (debt.interestRate / 100) * (debtFreeForecast ?? 12) / 12)
    : 0;

  const onTimePayments = payments.filter(
    (t) => new Date(t.date) <= new Date(debt.dueDate),
  ).length;
  const onTimeRatio = paymentCount > 0 ? onTimePayments / paymentCount : 0;

  const velocityScore = Math.min(100, principalPortion * 100);
  const frequencyScore = Math.min(100, paymentFrequency * 100);
  const onTimeScore = onTimeRatio * 100;
  const amountScore = monthlyRequired > 0
    ? Math.min(100, (averageMonthlyRepayment / monthlyRequired) * 100)
    : 100;

  const rawScore = (velocityScore * 0.3 + frequencyScore * 0.2 + onTimeScore * 0.3 + amountScore * 0.2);
  const debtHealthScore = Math.round(Math.min(100, Math.max(0, rawScore)));

  return {
    totalInterestEstimate,
    averageMonthlyRepayment,
    averagePaymentSize,
    largestPayment,
    smallestPayment,
    paymentFrequency,
    remainingBalance,
    estimatedPayoffDate,
    debtFreeForecast,
    payoffVelocity: Math.round(velocityScore),
    debtHealthScore,
  };
}

export function getPaymentTrend(
  debt: Debt,
  transactions: Transaction[],
  months = 12,
): PaymentTrendPoint[] {
  const matching = getMatchingDebtTransactions(debt, transactions);
  const map = new Map<string, number>();
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    map.set(key, 0);
  }
  for (const t of matching) {
    const d = new Date(t.date);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    if (map.has(key)) map.set(key, map.get(key)! + t.amount);
  }
  let runningTotal = 0;
  return Array.from(map.entries()).map(([month, paid]) => {
    runningTotal += paid;
    return { month, paid, runningTotal };
  });
}

export function getOutstandingTrend(
  debt: Debt,
  transactions: Transaction[],
  months = 12,
): OutstandingTrendPoint[] {
  const matching = getMatchingDebtTransactions(debt, transactions)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const now = new Date();
  const points: OutstandingTrendPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const paidBefore = matching
      .filter((t) => new Date(t.date) < monthEnd)
      .reduce((s, t) => s + t.amount, 0);
    const outstanding = Math.max(debt.originalAmount - paidBefore, 0);
    const label = monthStart.toLocaleString("en-US", { month: "short", year: "2-digit" });
    points.push({ month: label, outstanding });
  }
  return points;
}

export function getDebtDistribution(debts: Debt[], transactions: Transaction[]): DebtDistribution[] {
  return debts.map((d) => {
    const metrics = calculateDebtMetrics(d, transactions);
    return {
      name: d.name,
      originalAmount: d.originalAmount,
      remainingBalance: metrics.remainingBalance,
      amountPaid: metrics.amountPaid,
      percentagePaid: metrics.percentagePaid,
    };
  });
}

export function getPayoffForecast(
  debts: Debt[],
  transactions: Transaction[],
): PayoffForecast {
  const totalRemaining = debts.reduce((s, d) => {
    const m = calculateDebtMetrics(d, transactions);
    return s + m.remainingBalance;
  }, 0);

  const totalMinPayment = debts.reduce((s, d) => s + d.minimumPayment, 0);
  const monthlyRequired = totalMinPayment > 0 ? totalMinPayment : totalRemaining > 0 ? totalRemaining / 12 : 0;

  const monthsRemaining = monthlyRequired > 0 ? Math.ceil(totalRemaining / monthlyRequired) : 0;
  const estimatedPayoffDate = monthsRemaining > 0
    ? new Date(Date.now() + monthsRemaining * 30 * 24 * 60 * 60 * 1000).toISOString()
    : totalRemaining <= 0 ? new Date().toISOString() : null;

  return {
    monthsRemaining,
    estimatedPayoffDate,
    totalRemaining,
    monthlyRequired,
    onTrack: monthlyRequired > 0,
  };
}

export function getDebtUtilization(debts: Debt[], transactions: Transaction[]): DebtUtilization {
  const totalOriginal = debts.reduce((s, d) => s + d.originalAmount, 0);
  const totalPaid = debts.reduce((s, d) => {
    const m = calculateDebtMetrics(d, transactions);
    return s + m.amountPaid;
  }, 0);
  const totalRemaining = Math.max(totalOriginal - totalPaid, 0);
  const utilizationRate = totalOriginal > 0 ? (totalRemaining / totalOriginal) * 100 : 0;
  const payoffProgress = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 100;

  return { totalOriginal, totalRemaining, totalPaid, utilizationRate, payoffProgress };
}

export function getPaymentCalendar(
  debt: Debt,
  transactions: Transaction[],
): PaymentCalendarEntry[] {
  const matching = getMatchingDebtTransactions(debt, transactions)
    .filter((t) => t.amount > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = debt.originalAmount;
  return matching.map((t) => {
    runningBalance = Math.max(runningBalance - t.amount, 0);
    return {
      date: t.date,
      amount: t.amount,
      description: t.description,
      runningBalance,
    };
  });
}

export function getDebtAnalytics(
  debts: Debt[],
  transactions: Transaction[],
): DebtAnalytics | null {
  if (debts.length === 0) return null;

  const allMatching = debts.flatMap((d) => getMatchingDebtTransactions(d, transactions));
  const totalPayments = allMatching.reduce((s, t) => s + t.amount, 0);
  const paymentCount = allMatching.length;

  const sortedByAmount = [...allMatching].sort((a, b) => b.amount - a.amount);
  const largestPayments = sortedByAmount.slice(0, 5);

  const utilization = getDebtUtilization(debts, transactions);

  const totalOriginal = debts.reduce((s, d) => s + d.originalAmount, 0);
  const totalRemaining = debts.reduce((s, d) => {
    const m = calculateDebtMetrics(d, transactions);
    return s + m.remainingBalance;
  }, 0);

  const monthsElapsed = debts.length > 0
    ? Math.max(1, debts.reduce((minMs, d) => {
        const start = new Date(d.startDate).getTime();
        return Math.min(minMs, start);
      }, Infinity))
    : 1;
  const months = Math.max(1, (Date.now() - monthsElapsed) / (1000 * 60 * 60 * 24 * 30));

  const paymentDistribution = [
    { name: "Paid", value: totalPayments },
    { name: "Remaining", value: Math.max(totalOriginal - totalPayments, 0) },
  ];

  const payoffForecast = getPayoffForecast(debts, transactions);

  const paymentCalendar = allMatching
    .filter((t) => t.amount > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((t) => ({ date: t.date, amount: t.amount, description: t.description })) as PaymentCalendarEntry[];

  const debtDistribution = getDebtDistribution(debts, transactions);

  const aggregateInsights: DebtInsights = {
    totalInterestEstimate: debts.reduce((s, d) => {
      const ins = calculateDebtInsights(d, transactions);
      return s + ins.totalInterestEstimate;
    }, 0),
    averageMonthlyRepayment: totalPayments / months,
    averagePaymentSize: paymentCount > 0 ? totalPayments / paymentCount : 0,
    largestPayment: sortedByAmount[0]?.amount ?? 0,
    smallestPayment: paymentCount > 0 ? sortedByAmount[sortedByAmount.length - 1]?.amount ?? 0 : 0,
    paymentFrequency: paymentCount / months,
    remainingBalance: totalRemaining,
    estimatedPayoffDate: payoffForecast.estimatedPayoffDate,
    debtFreeForecast: payoffForecast.monthsRemaining,
    payoffVelocity: utilization.payoffProgress,
    debtHealthScore: Math.round(
      debts.reduce((s, d) => s + calculateDebtInsights(d, transactions).debtHealthScore, 0) / debts.length,
    ),
  };

  return {
    insights: aggregateInsights,
    paymentTrend: [],
    outstandingTrend: [],
    paymentDistribution,
    payoffForecast,
    debtDistribution,
    utilization,
    paymentCalendar,
    largestPayments: largestPayments.map((t) => ({
      date: t.date,
      amount: t.amount,
      description: t.description,
      runningBalance: 0,
    })),
  };
}

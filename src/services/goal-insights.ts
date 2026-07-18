import type { Goal, Transaction } from "@/types";
import { getMatchingGoalTransactions, calculateGoalMetrics } from "./goal-matching";

export interface GoalHistoryEntry {
  id: string;
  goalId: string;
  goalName: string;
  targetAmount: number;
  saved: number;
  percentage: number;
  completionDate: string;
  transactionCount: number;
  averageMonthlyRate: number;
  largestContribution: number;
  daysToComplete: number;
  archivedAt: string;
}

export interface ContributionTrendPoint {
  date: string;
  amount: number;
  cumulative: number;
}

export interface MonthlyProgressPoint {
  month: string;
  saved: number;
  target: number;
  percentage: number;
}

export interface GoalAnalytics {
  contributionTrend: ContributionTrendPoint[];
  monthlyProgress: MonthlyProgressPoint[];
  averageContribution: number;
  largestContribution: number;
  contributionFrequency: number;
  remainingVsTarget: number;
  completionVelocity: number;
  forecastAccuracy: number | null;
  savingsHeatmap: { day: number; count: number; total: number }[];
}

export function archiveGoalMetrics(goal: Goal, transactions: Transaction[]): GoalHistoryEntry {
  const metrics = calculateGoalMetrics(goal, transactions);
  const startMs = new Date(goal.startDate).getTime();
  const completionMs = metrics.completionDate
    ? new Date(metrics.completionDate).getTime()
    : Date.now();
  const daysToComplete = Math.max(1, Math.ceil((completionMs - startMs) / (1000 * 60 * 60 * 24)));

  return {
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10),
    goalId: goal.id,
    goalName: goal.name,
    targetAmount: goal.targetAmount,
    saved: metrics.saved,
    percentage: metrics.percentage,
    completionDate: metrics.completionDate ?? new Date().toISOString(),
    transactionCount: metrics.transactionCount,
    averageMonthlyRate: metrics.averageMonthlyRate,
    largestContribution: metrics.largestContribution,
    daysToComplete,
    archivedAt: new Date().toISOString(),
  };
}

export function getContributionTrend(goal: Goal, transactions: Transaction[]): ContributionTrendPoint[] {
  const matching = getMatchingGoalTransactions(goal, transactions)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let cumulative = 0;
  return matching.map((t) => {
    cumulative += t.amount;
    return { date: t.date, amount: t.amount, cumulative };
  });
}

export function getMonthlyProgress(goal: Goal, transactions: Transaction[], months = 12): MonthlyProgressPoint[] {
  const matching = getMatchingGoalTransactions(goal, transactions);
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
  return Array.from(map.entries()).map(([month, saved]) => ({
    month,
    saved,
    target: goal.targetAmount,
    percentage: goal.targetAmount > 0 ? (saved / goal.targetAmount) * 100 : 0,
  }));
}

export function getGoalAnalytics(goal: Goal, transactions: Transaction[]): GoalAnalytics {
  const matching = getMatchingGoalTransactions(goal, transactions);
  const metrics = calculateGoalMetrics(goal, transactions);
  const contributionTrend = getContributionTrend(goal, transactions);
  const monthlyProgress = getMonthlyProgress(goal, transactions);

  const daysOfWeek = Array.from({ length: 7 }, (_, i) => i);
  const savingsHeatmap = daysOfWeek.map((day) => {
    const dayTxs = matching.filter((t) => new Date(t.date).getDay() === day);
    return {
      day,
      count: dayTxs.length,
      total: dayTxs.reduce((s, t) => s + t.amount, 0),
    };
  });

  const forecastAccuracy = metrics.estimatedCompletionDate && !metrics.isCompleted
    ? (() => {
        const estMs = new Date(metrics.estimatedCompletionDate).getTime();
        const targetMs = new Date(goal.targetDate).getTime();
        if (estMs <= targetMs) return 100;
        const delay = (estMs - targetMs) / (1000 * 60 * 60 * 24);
        return Math.max(0, Math.min(100, 100 - (delay / 30) * 10));
      })()
    : metrics.isCompleted ? 100 : null;

  return {
    contributionTrend,
    monthlyProgress,
    averageContribution: metrics.averageContribution,
    largestContribution: metrics.largestContribution,
    contributionFrequency: metrics.contributionFrequency,
    remainingVsTarget: goal.targetAmount > 0 ? (metrics.remaining / goal.targetAmount) * 100 : 0,
    completionVelocity: metrics.averageMonthlyRate,
    forecastAccuracy,
    savingsHeatmap,
  };
}

const GOAL_TAG_SUGGESTIONS = [
  "Vacation", "Emergency", "Education", "Business",
  "Rent", "Car", "House", "Medical", "Wedding", "Investment",
];

export function suggestGoalTags(categories: string[]): string[] {
  const categoryToTag: Record<string, string> = {
    Rent: "Rent",
    "Medical": "Medical",
    Healthcare: "Medical",
    Education: "Education",
    Tuition: "Education",
    Salary: "Business",
    Freelance: "Business",
    Investment: "Investment",
    Dividend: "Investment",
    Travel: "Vacation",
    Vacation: "Vacation",
  };
  const matched = new Set<string>();
  for (const cat of categories) {
    const tag = categoryToTag[cat];
    if (tag) matched.add(tag);
  }
  return Array.from(matched);
}

export function suggestGoalsForTransaction(
  tx: Transaction,
  goals: Goal[],
  transactions: Transaction[],
): { goal: Goal; currentSaved: number; wouldAdd: number; newPercentage: number }[] {
  return goals
    .filter((g) => {
      if (g.isCompleted ?? false) return false;
      const metrics = calculateGoalMetrics(g, transactions);
      return !metrics.isCompleted;
    })
    .map((g) => {
      const metrics = calculateGoalMetrics(g, transactions);
      const wouldAdd = tx.amount;
      const newSaved = metrics.saved + wouldAdd;
      const newPercentage = g.targetAmount > 0 ? (newSaved / g.targetAmount) * 100 : 0;
      return { goal: g, currentSaved: metrics.saved, wouldAdd, newPercentage };
    })
    .filter((s) => s.newPercentage <= 120)
    .sort((a, b) => b.newPercentage - a.newPercentage)
    .slice(0, 3);
}

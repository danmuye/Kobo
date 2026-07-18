import type { Goal, Transaction } from "@/types";

export function getGoalSafeArray<T>(arr: T[] | null | undefined): T[] {
  return Array.isArray(arr) ? arr : [];
}

export interface GoalMetrics {
  saved: number;
  remaining: number;
  percentage: number;
  daysRemaining: number;
  transactionCount: number;
  isCompleted: boolean;
  isOverTarget: boolean;
  isExpired: boolean;
  completionDate: string | null;
  estimatedCompletionDate: string | null;
  averageMonthlyRate: number;

  averageDailySaving: number;
  requiredDailySaving: number;
  requiredWeeklySaving: number;
  requiredMonthlySaving: number;
  healthScore: number;
  contributionFrequency: number;
  savingsConsistency: number;
  largestContribution: number;
  averageContribution: number;
  daysElapsed: number;
}

export type GoalStatusValue =
  | "on-track"
  | "behind"
  | "completed"
  | "exceeded"
  | "expired";

export interface GoalStatusInfo {
  label: string;
  tone: "blue" | "green" | "amber" | "purple" | "destructive";
  value: GoalStatusValue;
}

export function getGoalStatus(pct: number, isCompleted: boolean, isExpired: boolean): GoalStatusInfo {
  if (isExpired) return { label: "Expired", tone: "destructive", value: "expired" };
  if (isCompleted) return { label: "Completed", tone: "purple", value: "completed" };
  if (pct > 100) return { label: "Exceeded", tone: "purple", value: "exceeded" };
  if (pct >= 80) return { label: "Near Target", tone: "amber", value: "behind" };
  if (pct >= 40) return { label: "On Track", tone: "green", value: "on-track" };
  return { label: "Getting Started", tone: "blue", value: "on-track" };
}

export const goalStatusColors: Record<GoalStatusValue, string> = {
  "on-track": "hsl(217 91% 60%)",
  behind: "hsl(38 92% 50%)",
  completed: "hsl(271 76% 53%)",
  exceeded: "hsl(271 76% 53%)",
  expired: "hsl(0 84% 60%)",
};

function transactionMatchesGoalType(tx: Transaction, goal: Goal): boolean {
  switch (goal.fundingType) {
    case "Income":
      return tx.type === "income";
    case "Savings Transfer":
      if (tx.type !== "transfer") return false;
      if (goal.wallets.length > 0) {
        return goal.wallets.includes(tx.toAccount ?? "");
      }
      if (goal.accounts.length > 0) {
        return goal.accounts.includes(tx.toAccount ?? "");
      }
      return true;
    case "Manual Deposit":
      return tx.type === "income" || (goal.includeTransfers && tx.type === "transfer");
    case "Mixed":
    default:
      if (tx.type === "income") return true;
      if (tx.type === "transfer" && goal.includeTransfers) return true;
      if (tx.type === "expense" && goal.includeTransfers) return true;
      return tx.type === "income";
  }
}

export function getMatchingGoalTransactions(
  goal: Goal,
  transactions: Transaction[],
): Transaction[] {
  return transactions.filter((t) => t.goalId === goal.id);
}

export function calculateGoalMetrics(
  goal: Goal,
  transactions: Transaction[],
  referenceDate: Date = new Date(),
): GoalMetrics {
  const matching = getMatchingGoalTransactions(goal, transactions);

  const saved = matching.reduce((sum, t) => sum + t.amount, 0);
  const remaining = Math.max(goal.targetAmount - saved, 0);
  const percentage = goal.targetAmount === 0 ? 0 : (saved / goal.targetAmount) * 100;

  const refMs = referenceDate.getTime();
  const targetMs = new Date(goal.targetDate).getTime();
  const daysRemaining = Math.max(0, Math.ceil((targetMs - refMs) / (1000 * 60 * 60 * 24)));

  const isCompleted = saved >= goal.targetAmount;
  const isExpired = !isCompleted && refMs > targetMs;

  let completionDate: string | null = null;
  if (isCompleted) {
    const completedTx = matching.find((t) => {
      const cumulative = matching
        .filter((mt) => new Date(mt.date).getTime() <= new Date(t.date).getTime())
        .reduce((s, mt) => s + mt.amount, 0);
      return cumulative >= goal.targetAmount;
    });
    completionDate = completedTx?.date ?? null;
  }

  let estimatedCompletionDate: string | null = null;
  if (!isCompleted && saved > 0 && daysRemaining > 0) {
    const startMs = new Date(goal.startDate).getTime();
    const daysElapsed = Math.max(1, Math.ceil((refMs - startMs) / (1000 * 60 * 60 * 24)));
    const dailyRate = saved / daysElapsed;
    if (dailyRate > 0) {
      const daysNeeded = Math.ceil(remaining / dailyRate);
      const estDate = new Date(referenceDate);
      estDate.setDate(estDate.getDate() + daysNeeded);
      estimatedCompletionDate = estDate.toISOString();
    }
  }

  const daysElapsed = Math.max(1, Math.ceil((refMs - new Date(goal.startDate).getTime()) / (1000 * 60 * 60 * 24)));
  const monthsElapsed = Math.max(1, daysElapsed / 30);
  const averageMonthlyRate = saved / monthsElapsed;

  const averageDailySaving = saved / daysElapsed;
  const requiredDailySaving = remaining > 0 && daysRemaining > 0 ? remaining / daysRemaining : 0;
  const requiredWeeklySaving = requiredDailySaving * 7;
  const requiredMonthlySaving = requiredDailySaving * 30;

  const largestContribution = matching.length > 0 ? Math.max(...matching.map((t) => t.amount)) : 0;
  const averageContribution = matching.length > 0 ? saved / matching.length : 0;

  const contributionFrequency = monthsElapsed > 0 ? matching.length / monthsElapsed : 0;

  let savingsConsistency = 0;
  if (matching.length >= 2) {
    const sorted = [...matching].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(
        (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / (1000 * 60 * 60 * 24),
      );
    }
    const meanGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    const variance = gaps.reduce((s, g) => s + (g - meanGap) ** 2, 0) / gaps.length;
    const cv = meanGap > 0 ? Math.sqrt(variance) / meanGap : 0;
    savingsConsistency = Math.max(0, Math.min(100, (1 - Math.min(cv, 2) / 2) * 100));
  } else if (matching.length === 1) {
    savingsConsistency = 50;
  }

  const paceScore = requiredDailySaving > 0
    ? Math.min(100, (averageDailySaving / requiredDailySaving) * 100)
    : saved >= goal.targetAmount ? 100 : 0;
  const timeScore = daysRemaining > 0 ? Math.min(100, (daysRemaining / Math.max(daysElapsed, 1)) * 100) : isCompleted ? 100 : 0;
  const healthScore = Math.round(
    Math.min(100,
      (percentage * 0.35) +
      (paceScore * 0.30) +
      (savingsConsistency * 0.20) +
      (timeScore * 0.15),
    ),
  );

  return {
    saved,
    remaining,
    percentage,
    daysRemaining,
    transactionCount: matching.length,
    isCompleted,
    isOverTarget: saved > goal.targetAmount,
    isExpired,
    completionDate,
    estimatedCompletionDate,
    averageMonthlyRate,
    averageDailySaving,
    requiredDailySaving,
    requiredWeeklySaving,
    requiredMonthlySaving,
    healthScore,
    contributionFrequency,
    savingsConsistency,
    largestContribution,
    averageContribution,
    daysElapsed,
  };
}

export function calculateGoalsTotal(
  goals: Goal[],
  transactions: Transaction[],
): { totalSaved: number; totalTarget: number; remaining: number; pct: number } {
  let totalSaved = 0;
  let totalTarget = 0;
  for (const g of goals) {
    const m = calculateGoalMetrics(g, transactions);
    totalSaved += m.saved;
    totalTarget += g.targetAmount;
  }
  const remaining = Math.max(totalTarget - totalSaved, 0);
  const pct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  return { totalSaved, totalTarget, remaining, pct };
}

export interface MonthlyGoalSavings {
  month: string;
  contributions: number;
}

export function getMonthlyGoalSavings(
  goals: Goal[],
  transactions: Transaction[],
  months = 6,
): MonthlyGoalSavings[] {
  const map = new Map<string, number>();
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    map.set(key, 0);
  }

  for (const g of goals) {
    const matching = getMatchingGoalTransactions(g, transactions);
    for (const t of matching) {
      const d = new Date(t.date);
      const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      if (map.has(key)) {
        map.set(key, map.get(key)! + t.amount);
      }
    }
  }

  return Array.from(map.entries()).map(([month, contributions]) => ({ month, contributions }));
}

export interface GoalCompletionForecast {
  goalId: string;
  goalName: string;
  saved: number;
  target: number;
  remaining: number;
  monthlyRate: number;
  estimatedDate: string | null;
  monthsToCompletion: number | null;
  onTrack: boolean;
  targetDate: string;
}

export function getGoalCompletionForecast(
  goals: Goal[],
  transactions: Transaction[],
): GoalCompletionForecast[] {
  return goals.map((g) => {
    const metrics = calculateGoalMetrics(g, transactions);
    const monthsToCompletion = metrics.estimatedCompletionDate
      ? Math.max(0, (new Date(metrics.estimatedCompletionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
      : null;
    return {
      goalId: g.id,
      goalName: g.name,
      saved: metrics.saved,
      target: g.targetAmount,
      remaining: metrics.remaining,
      monthlyRate: metrics.averageMonthlyRate,
      estimatedDate: metrics.estimatedCompletionDate,
      monthsToCompletion: monthsToCompletion !== null ? Math.ceil(monthsToCompletion) : null,
      onTrack: metrics.estimatedCompletionDate !== null
        ? new Date(metrics.estimatedCompletionDate).getTime() <= new Date(g.targetDate).getTime()
        : false,
      targetDate: g.targetDate,
    };
  });
}

export interface GoalOverallTimeline {
  totalSaved: number;
  totalTarget: number;
  totalRemaining: number;
  combinedMonthlyRate: number;
  estimatedMonths: number | null;
  estimatedDate: string | null;
  forecastMonths: { month: string; cumulative: number; target: number }[];
}

export function getGoalOverallTimeline(
  goals: Goal[],
  transactions: Transaction[],
): GoalOverallTimeline {
  const totals = calculateGoalsTotal(goals, transactions);
  const forecasts = getGoalCompletionForecast(goals, transactions);

  let combinedMonthlyRate = 0;
  let goalsWithRate = 0;
  for (const f of forecasts) {
    if (f.monthlyRate > 0) {
      combinedMonthlyRate += f.monthlyRate;
      goalsWithRate++;
    }
  }

  const estimatedMonths =
    combinedMonthlyRate > 0 && totals.remaining > 0
      ? Math.ceil(totals.remaining / combinedMonthlyRate)
      : null;

  const estimatedDate =
    estimatedMonths !== null
      ? new Date(Date.now() + estimatedMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const forecastMonths: { month: string; cumulative: number; target: number }[] = [];
  if (combinedMonthlyRate > 0) {
    const projectionMonths = Math.min(estimatedMonths ?? 12, 24);
    let cumulative = totals.totalSaved;
    const now = new Date();
    for (let i = 1; i <= projectionMonths; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      cumulative += combinedMonthlyRate;
      forecastMonths.push({
        month: key,
        cumulative: Math.min(cumulative, totals.totalTarget),
        target: totals.totalTarget,
      });
    }
  }

  return {
    totalSaved: totals.totalSaved,
    totalTarget: totals.totalTarget,
    totalRemaining: totals.remaining,
    combinedMonthlyRate,
    estimatedMonths,
    estimatedDate,
    forecastMonths,
  };
}

export function getGoalFastestGrowing(
  goals: Goal[],
  transactions: Transaction[],
): { goalId: string; goalName: string; monthlyRate: number; pct: number } | null {
  let best: { goalId: string; goalName: string; monthlyRate: number; pct: number } | null = null;
  for (const g of goals) {
    const metrics = calculateGoalMetrics(g, transactions);
    if (!best || metrics.averageMonthlyRate > best.monthlyRate) {
      best = {
        goalId: g.id,
        goalName: g.name,
        monthlyRate: metrics.averageMonthlyRate,
        pct: metrics.percentage,
      };
    }
  }
  return best;
}

export function migrateGoal(old: Record<string, unknown>): Goal {
  return {
    id: String(old.id ?? ""),
    name: String(old.name ?? ""),
    targetAmount: Number(old.targetAmount ?? old.target ?? 0),
    targetDate: String(old.targetDate ?? old.deadline ?? ""),
    startDate: String(old.startDate ?? old.createdAt ?? new Date().toISOString()),
    fundingType: (old.fundingType as Goal["fundingType"]) || "Mixed",
    categories: Array.isArray(old.categories) ? old.categories : [],
    accounts: Array.isArray(old.accounts) ? old.accounts : [],
    wallets: Array.isArray(old.wallets) ? old.wallets : [],
    tags: Array.isArray(old.tags) ? old.tags : [],
    color: String(old.color ?? "#8b5cf6"),
    icon: String(old.icon ?? "target"),
    priority: (old.priority as Goal["priority"]) || "medium",
    notes: String(old.notes ?? ""),
    autoTrack: old.autoTrack === true,
    includeTransfers: old.includeTransfers === true,
    createdAt: String(old.createdAt ?? new Date().toISOString()),
    updatedAt: String(old.updatedAt ?? new Date().toISOString()),
  };
}

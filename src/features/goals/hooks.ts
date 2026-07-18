import { useMemo, useCallback } from "react";
import { useFinanceStore, calculateGoalMetrics, type GoalMetrics } from "@/store/finance";
import { getFinanceService } from "@/services/service-provider";
import { getGoalAnalytics, type GoalAnalytics } from "@/services/goal-insights";
import type { Goal } from "@/types";

export interface GoalWithMetrics extends Goal {
  metrics: GoalMetrics;
}

export interface GoalWithAnalytics extends GoalWithMetrics {
  analytics: GoalAnalytics;
}

const metricsCache = new Map<string, GoalMetrics>();

export function useGoalsPage() {
  const goals = useFinanceStore((s) => s.goals);
  const transactions = useFinanceStore((s) => s.transactions);

  const goalsWithMetrics: GoalWithMetrics[] = useMemo(
    () => goals.map((goal) => {
      const cached = metricsCache.get(goal.id);
      if (cached) return { ...goal, metrics: cached };
      const metrics = calculateGoalMetrics(goal, transactions);
      metricsCache.set(goal.id, metrics);
      return { ...goal, metrics };
    }),
    [goals, transactions],
  );

  const svc = getFinanceService();

  const addGoal = useCallback((data: Omit<Goal, "id">) => svc.goals.create(data), [svc]);
  const updateGoal = useCallback((id: string, data: Partial<Goal>) => {
    metricsCache.delete(id);
    return svc.goals.update(id, data);
  }, [svc]);
  const deleteGoal = useCallback((id: string) => {
    metricsCache.delete(id);
    return svc.goals.delete(id);
  }, [svc]);

  const invalidateMetric = useCallback((id: string) => {
    metricsCache.delete(id);
  }, []);

  return {
    goals: goalsWithMetrics,
    addGoal,
    updateGoal,
    deleteGoal,
    invalidateMetric,
  };
}

const analyticsCache = new Map<string, GoalAnalytics>();

export function useGoalAnalytics(goalId: string | null): GoalAnalytics | null {
  const goals = useFinanceStore((s) => s.goals);
  const transactions = useFinanceStore((s) => s.transactions);

  return useMemo(() => {
    if (!goalId) return null;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return null;

    const cached = analyticsCache.get(goalId);
    if (cached) return cached;

    const analytics = getGoalAnalytics(goal, transactions);
    analyticsCache.set(goalId, analytics);
    return analytics;
  }, [goalId, goals, transactions]);
}

export function useGoalMetrics(goalId: string | null): GoalMetrics | null {
  const goals = useFinanceStore((s) => s.goals);
  const transactions = useFinanceStore((s) => s.transactions);

  return useMemo(() => {
    if (!goalId) return null;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return null;

    const cached = metricsCache.get(goalId);
    if (cached) return cached;

    const metrics = calculateGoalMetrics(goal, transactions);
    metricsCache.set(goalId, metrics);
    return metrics;
  }, [goalId, goals, transactions]);
}
